# 14 - RAG / LLM / MCP Acceptance

Date: 2026-03-20

## RAG Health

- `GET /api/v1/rag/health`:
  ```json
  {"status":"degraded","external_rag":{"configured":true,"healthy":false}}
  ```
- `compose-ingestor-1` Docker container is **UNHEALTHY**.
- RAG search still works via fallback (tuteur responses include citations).

**Status:** DEGRADED (known issue, non-blocking for LLM features)

## MCP Server

- `GET /api/mcp/health`:
  ```json
  {"status":"healthy","mcpUrl":"http://localhost:3100","latencyMs":11,"mcpVersion":"1.0.0","tools":20}
  ```
- 20 tools registered.

**Status:** VALIDATED

## LLM Integration

| Feature | Result |
|---------|--------|
| Tuteur libre | Real LLM responses with RAG context injection |
| Quiz generation | Structured JSON output with questions, options, scoring |
| Oral evaluation | Multi-phase scoring with pedagogical feedback |
| Atelier langue | Grammar exercises generated correctly |
| All responses in French | Confirmed |
| Citations and resource references | Included |

**Status:** VALIDATED
