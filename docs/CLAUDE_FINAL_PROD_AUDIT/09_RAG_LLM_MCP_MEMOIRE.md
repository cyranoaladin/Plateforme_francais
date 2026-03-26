# PHASE 9 — RAG, LLM, MCP, MÉMOIRE

> **Audit revalidé 2026-03-22** — Code audit + prod tests, SHA `9e386b5`

---

## RAG (Retrieval-Augmented Generation)

| Aspect | Résultat |
|--------|----------|
| Health endpoint | ✅ `GET /api/v1/rag/health` → 200 (public) |
| Quota enforcement | ✅ `RAG_SEARCH` quota par plan |
| Ingesteur | ⚠️ Timeout signalé (P0-002) — ne bloque pas les recherches existantes |
| Vector DB | ✅ PostgreSQL + pgvector extension |

## LLM Orchestration

| Aspect | Résultat |
|--------|----------|
| Routing | ✅ `routeQuery()` → `orchestrate()` pattern |
| Token quota | ✅ `LLM_TOKENS` quota enforced per plan |
| Streaming | ✅ SSE pour réponses tuteur et oral |
| Sanitization | ✅ `sanitizeLlmText()` utilisé côté front |
| Error handling | ✅ Graceful degradation avec messages utilisateur clairs |

## MCP Server (`packages/mcp-server`)

| Aspect | Résultat |
|--------|----------|
| Build | ✅ `npm run mcp:build` dans le deploy script |
| Tools | 24 outils MCP déclarés |
| Bind address | ⚠️ P0-004 — bind 0.0.0.0 (devrait être 127.0.0.1 en prod) |

## Mémoire (Memory Events)

| Aspect | Résultat |
|--------|----------|
| Timeline API | ✅ `GET /api/v1/memory/timeline` — auth required |
| Event types | ✅ evaluation, navigation, interaction |
| Repository | ✅ `createMemoryEventRecord()` — Prisma, pas de fallback local en prod |
| Dashboard integration | ✅ Hook `useDashboard()` consomme timeline |

## Défauts

| ID | Sévérité | Description | Réf. |
|----|----------|-------------|------|
| P9-001 | MOYENNE | RAG ingesteur timeout | P0-002 |
| P9-002 | MOYENNE | MCP bind 0.0.0.0 en prod | P0-004 |
