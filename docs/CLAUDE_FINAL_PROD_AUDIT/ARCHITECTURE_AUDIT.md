# NEXUS REUSSITE EAF — ARCHITECTURE AUDIT

**Date**: 2026-03-22 13:00 UTC
**SHA**: 9e386b5

---

## 1. CARTE DES SERVICES

### EAF (port isolation OK)
| Service | Port | Bind | Status |
|---------|------|------|--------|
| eaf-nextjs | 3000 | 127.0.0.1 | OK |
| eaf-mcp | 3100 | 127.0.0.1 | OK |
| eaf-worker | N/A | N/A | OK |
| PostgreSQL | 5433 | 127.0.0.1 | OK |
| Redis | 6379 | 127.0.0.1 | OK |
| Ollama | 11434 | 127.0.0.1 (docker) | OK |
| RAG Ingestor | 18001 | 127.0.0.1 (docker) | OK |

### Autres services PM2 (NON EAF)
| Service | Port | Bind | ISSUE |
|---------|------|------|-------|
| brevet-master | 3010 | 0.0.0.0 | EXPOSE |
| journey-web | 3005 | 0.0.0.0 | EXPOSE |
| mf-backend | 3003 | 0.0.0.0 | EXPOSE |
| mfai-main | 3006 | 0.0.0.0 | EXPOSE |

### Docker (CRITICAL)
| Container | Port | Bind | ISSUE |
|-----------|------|------|-------|
| nexus-next-app | 3001 | 0.0.0.0 | OLD EAF CLONE PUBLIC |
| nexus-postgres-db | 5435 | 127.0.0.1 | OK |
| compose-ollama-1 | 11434 | 127.0.0.1 | OK |
| compose-ingestor-1 | 18001 | 127.0.0.1 | OK |
| compose-chroma-1 | 8000 | 127.0.0.1 | OK |

## 2. CRITICAL: nexus-next-app Docker on 0.0.0.0:3001

An old Docker deployment of EAF is publicly accessible on port 3001.
It may serve stale code, bypass Nginx security headers, and confuse users.

**Action required**: `docker stop nexus-next-app` or rebind to 127.0.0.1.

## 3. RAG STATUS

| Check | Result |
|-------|--------|
| pgvector | v0.6.0 installed |
| Chunk table | EXISTS but 0 rows |
| Embeddings | Table not found (uses Chunk) |
| RAG ingestor | Docker running on 127.0.0.1:18001 |
| Resources | 548 files in /srv/eaf_ressources |

**RAG is structurally ready** (pgvector, Chunk table, ingestor running)
but **corpus not indexed** (0 chunks). The tuteur uses LLM general knowledge.

## 4. DB HEALTH

| Check | Result |
|-------|--------|
| Tables | 28+ in public schema |
| Migrations | 21 applied, 0 pending |
| Orphan profiles | 0 |
| Stuck DRAFT sessions | 1 (>24h) |
| Memory events | 262 total (7 types) |

## 5. MEMORY

| Check | Result |
|-------|--------|
| RAM total | 64 GB |
| RAM used | 10 GB (15%) |
| Swap used | 33 MB |
| OOM kills | 0 |
| EAF memory | ~270 MB (nextjs+mcp+worker) |

## 6. LLM PROVIDERS

Mistral API key configured. Gemini/OpenAI status unclear from env.
Tuteur responds with rich content — LLM pipeline functional.

## 7. DEFECTS

### CRITICAL
- [ ] nexus-next-app Docker on 0.0.0.0:3001 (old EAF clone public)

### MEDIUM (non-EAF, user decision)
- [ ] brevet-master/journey-web/mf-backend/mfai-main on 0.0.0.0
- [ ] RAG corpus empty (0 chunks indexed)

### LOW
- [ ] 1 stuck DRAFT oral session (>24h)
