# 05 - MCP Server, LLM Router, RAG Pipeline & Memory System

**Audit date:** 2026-03-20
**Scope:** `packages/mcp-server/src/`, `src/lib/llm/`, `src/lib/rag/`, `src/lib/memory/`, `src/lib/mcp/`, `src/lib/agents/`

---

## 1. MCP Server Architecture

**Package:** `packages/mcp-server/`
**Server name:** `nexus-eaf-mcp` v1.0.0
**Protocol:** Model Context Protocol (MCP) via `@modelcontextprotocol/sdk`
**Transports:** stdio (dev/Claude Desktop) and HTTP/SSE (production PM2 on port 3100)

### 1.1 Infrastructure

| Component | File | Description |
|-----------|------|-------------|
| Entry point | `src/index.ts` | Dispatches to stdio or HTTP transport based on `MCP_TRANSPORT` env |
| Server core | `src/server.ts` | Creates MCP server, registers all handlers (tools, resources, prompts) |
| HTTP transport | `src/transport-http.ts` | Custom HTTP server with CORS, Bearer auth, `/health` and `/mcp` endpoints |
| DB singleton | `src/lib/db.ts` | Prisma client singleton with health check (`SELECT 1`) |
| Redis singleton | `src/lib/redis.ts` | IORedis with rate limiting, caching, BullMQ queue length monitoring |
| Auth/scopes | `src/lib/auth.ts` | Per-agent scope enforcement, API key verification (timing-safe), context extraction |
| Policy gate | `src/lib/policy-gate.ts` | 9 immutable compliance rules checked pre/post-generation |
| Logger | `src/lib/logger.ts` | Pino logger with secret redaction, tool call logging, compliance event logging |
| Types | `src/types/index.ts` | Shared types: StudentProfile, SkillMap, ErrorBankItem, CorpusChunk, AgentSkill, etc. |

### 1.2 Security

- **API key required** in HTTP mode; timing-safe comparison via `crypto.timingSafeEqual`
- **Agent scope enforcement:** each AgentSkill has a whitelist of allowed tools (see Section 1.4)
- **Rate limiting:** Redis-based per-student, configurable via `MCP_RATE_LIMIT_PER_MINUTE` (default 100)
- **HTTP mode forces `system` scope:** client-supplied `agentSkill` is ignored in HTTP transport to prevent privilege escalation

---

## 2. MCP Tools (19 total)

### 2.1 Student Domain (5 tools)

| # | Tool Name | Description | Key Input Schema | Status | Dependencies |
|---|-----------|-------------|------------------|--------|--------------|
| 1 | `eaf_get_student_profile` | Full pedagogical profile: SkillMap (5 axes), oeuvres, EAF date, plan, XP, streak | `studentId`, `includeSkillMap?`, `includeHistory?` | **Real** — Prisma queries User+Profile+Subscription | Prisma, DB |
| 2 | `eaf_update_skill_map` | Update competency scores after interactions; detects drift (>14d stagnation) | `studentId`, `sourceInteractionId`, `sourceType`, `updates[]` (microSkillId, newScore, evidence) | **Real** — Updates weakSkills array, creates MemoryEvent | Prisma, DB |
| 3 | `eaf_get_error_bank` | Retrieves student errors with Spaced Repetition scheduling | `studentId`, `filter` (due_today/all_active/archived), `errorTypes[]?`, `limit?` | **Real** — Queries ErrorBankItem table, counts active/archived | Prisma (optional ErrorBankItem model) |
| 4 | `eaf_schedule_revision` | Creates a Spaced Repetition entry with J+1/J+2/J+3/J+7/J+21 schedule by severity | `studentId`, `errorType`, `errorContext` (10-500 chars), `sourceInteractionId`, `severity` | **Real** — Creates ErrorBankItem, checks push subscription | Prisma, DB |
| 5 | `eaf_get_study_plan` | Rolling 7-day study plan with today's tasks and ErrorBank urgencies | `studentId`, `scope` (today/week/full) | **Partial** — Returns plan metadata from MemoryEvent, but `todayTasks` always empty array | Prisma, DB |

### 2.2 RAG Domain (3 tools)

| # | Tool Name | Description | Key Input Schema | Status | Dependencies |
|---|-----------|-------------|------------------|--------|--------------|
| 6 | `eaf_search_corpus` | Hybrid search: pgvector cosine similarity + PostgreSQL BM25 full-text | `query` (min 3 chars), `filters?` (authorityLevel A-D, docType, objetEtude, sessionYear), `topK` (1-20, default 8), `rerank?`, `requireAuthorityA?` | **Real** — Full implementation with vector+lexical merge, dedup, authority boost reranking | pgvector, Ollama embeddings, Prisma raw SQL |
| 7 | `eaf_get_chunk` | Retrieves a document fragment by ID with neighbor context | `chunkId`, `includeNeighbors?`, `neighborWindow?` (1-3) | **Real** — Prisma raw SQL with neighbor query by chunkIndex | Prisma, DB |
| 8 | `eaf_index_document` | **ADMIN ONLY** — Indexes a new document into RAG corpus with copyright check (R-COPY-01) | `sourceUrl`, `sourceOrg`, `authorityLevel`, `docType`, `license`, `legalBasis`, `sessionYear`, `forceReindex?` | **Real** — Downloads URL, chunks text (1000 chars), generates embeddings, inserts with dedup by SHA-256 hash | Ollama embeddings, Prisma raw SQL, fetch |

### 2.3 Evaluation Domain (3 tools)

| # | Tool Name | Description | Key Input Schema | Status | Dependencies |
|---|-----------|-------------|------------------|--------|--------------|
| 9 | `eaf_get_correction` | Retrieves a copy correction result with optional OCR text | `copieId`, `studentId`, `includeOcrText?` | **Real** — Prisma query on CopieDeposee with Epreuve include | Prisma, DB |
| 10 | `eaf_save_evaluation` | Persists quiz/exercise result, updates XP, triggers badge check | `studentId`, `evaluationType`, `score`, `maxScore`, `details[]`, `sessionId?`, `triggerBadgeCheck?` | **Real** — Creates Evaluation, increments XP on StudentProfile. Badge check returns empty (stub) | Prisma, DB |
| 11 | `eaf_get_oral_session` | Retrieves oral simulation session data with 2/8/2/8 grid | `sessionId`, `studentId` | **Partial** — Retrieves OralSession but `phases`, `relancesJury`, and `bilan` always empty/stub | Prisma, DB |

### 2.4 Planning Domain (2 tools)

| # | Tool Name | Description | Key Input Schema | Status | Dependencies |
|---|-----------|-------------|------------------|--------|--------------|
| 12 | `eaf_generate_plan` | Generates adaptive 7-day study plan based on cognitive profile | `studentId`, `forceRegenerate?`, `constraints?` (availableDays, maxMinutes, focusAxis, avoidAxis) | **Partial** — Creates MemoryEvent but returns empty `days[]` and hardcoded objective | Prisma, DB |
| 13 | `eaf_mark_task_complete` | Marks a plan task as done, updates streak and adherence | `studentId`, `taskId`, `completedAt?` | **Partial** — Creates MemoryEvent, increments XP (+5), but streak/adherence always 0 | Prisma, DB |

### 2.5 Analytics Domain (3 tools)

| # | Tool Name | Description | Key Input Schema | Status | Dependencies |
|---|-----------|-------------|------------------|--------|--------------|
| 14 | `eaf_get_weekly_stats` | Aggregated weekly stats: sessions, adherence, XP, ErrorBank | `studentId`, `weekOffset` (0 to -52) | **Real** — Queries Evaluation and MemoryEvent tables, computes adherence rate and activity breakdown | Prisma, DB |
| 15 | `eaf_get_skill_delta` | Competency evolution between two dates | `studentId`, `fromDate`, `toDate?`, `axes[]?` | **Real** — Analyzes Evaluation payloads for skillUpdates, computes per-axis deltas | Prisma, DB |
| 16 | `eaf_generate_report` | Launches async weekly PDF report generation, returns jobId for polling | `studentId`, `weekOffset?`, `forceRegenerate?` | **Partial** — Creates MemoryEvent and returns jobId/pollUrl, but no actual report generation worker | Prisma, DB |

### 2.6 Compliance Domain (2 tools)

| # | Tool Name | Description | Key Input Schema | Status | Dependencies |
|---|-----------|-------------|------------------|--------|--------------|
| 17 | `eaf_check_policy` | Validates LLM output against compliance rules (R-AIACT-01, R-FRAUD-01, R-RGPD-01, etc.) | `checkType` (pre/post_generation), `ruleIds[]?`, `requestContext?`, `llmOutput?`, `outputType?` | **Real** — 9 rules with regex pattern matching, sanitization for warn violations, DB audit trail | Policy gate, Prisma |
| 18 | `eaf_log_rule_event` | Records a compliance event in the immutable audit trail | `ruleId`, `action` (allow/deny/sanitize/warn), `reason`, `skill`, `studentId?`, `metadata?` | **Real** — Creates MemoryEvent of type `compliance_event` | Prisma, DB |

### 2.7 Billing Domain (2 tools)

| # | Tool Name | Description | Key Input Schema | Status | Dependencies |
|---|-----------|-------------|------------------|--------|--------------|
| 19 | `eaf_get_subscription` | Checks active plan and feature availability | `studentId`, `feature?` | **Real** — Queries Subscription table, checks against PLAN_LIMITS (FREE/MONTHLY/LIFETIME) | Prisma, DB |
| 20 | `eaf_get_usage` | Returns daily/monthly usage counters | `studentId`, `period` (today/month) | **Real** — Queries UsageCounter table by periodKey prefix | Prisma, DB |

### 2.3 Implementation Status Summary

| Status | Count | Notes |
|--------|-------|-------|
| **Fully real** | 13 | Complete DB-backed implementation |
| **Partial (stub fields)** | 6 | Core works but some return fields are hardcoded empty (badges, phases, days, streak) |
| **Pure stub** | 0 | All tools have at least partial implementations |

### 2.4 Agent Scope Matrix

| Agent | Allowed Tools |
|-------|---------------|
| `diagnosticien` | get_student_profile, update_skill_map, search_corpus, generate_plan, save_evaluation, check_policy, log_rule_event |
| `coach-oral` | get_student_profile, get_oral_session, save_evaluation, get_chunk, search_corpus, check_policy, log_rule_event, schedule_revision |
| `rag-librarian` | search_corpus, get_chunk, check_policy, log_rule_event, get_student_profile |
| `correcteur` | get_student_profile, get_correction, update_skill_map, schedule_revision, save_evaluation, search_corpus, check_policy, log_rule_event |
| `quiz-maitre` | get_student_profile, update_skill_map, save_evaluation, get_error_bank, schedule_revision, search_corpus, check_policy |
| `coach-ecrit` | get_student_profile, search_corpus, get_chunk, check_policy, log_rule_event, save_evaluation |
| `tuteur-libre` | get_student_profile, search_corpus, get_chunk, get_error_bank, check_policy, get_study_plan |
| `avocat-diable` | get_student_profile, search_corpus, get_chunk, check_policy, log_rule_event |
| `rapport-auto` | get_weekly_stats, get_skill_delta, get_error_bank, generate_report, get_student_profile, check_policy |
| `rappel-agent` | get_error_bank, schedule_revision, mark_task_complete, get_student_profile |
| `admin` | **All 20 tools** including index_document and health_check |
| `system` | health_check, get_subscription, get_usage, log_rule_event |

---

## 3. MCP Resources (3 total)

| URI Pattern | Name | Type | Source |
|-------------|------|------|--------|
| `nexus://student/{studentId}/profile` | Profil eleve | text/markdown | DB query: user+profile+subscription, formats as markdown with SkillMap, weakSkills, ErrorBank status |
| `nexus://corpus/eaf-rules` | Regles officielles EAF | text/markdown | Hardcoded: exam structure (ecrit 4h coef 5, oral 20min coef 5), baremes 2/8/2/8, objets d'etude, procedes |
| `nexus://system/compliance-rules` | Regles de compliance | text/markdown | Generated from policy-gate COMPLIANCE_RULES definitions |

---

## 4. MCP Prompts (3 total)

| Prompt Name | Description | Arguments | Implementation |
|-------------|-------------|-----------|----------------|
| `eaf_diagnostic_prompt` | System prompt for Diagnosticien agent | `studentId` (required), `progressionMode?` (rapide/normal/approfondi) | Generates full prompt with compliance rules, JSON output schema for SkillMap 5-axes |
| `eaf_correction_feedback_prompt` | System prompt for Correcteur with official grading grid | `epreuveType` (commentaire/dissertation), `oeuvre` | Embeds type-specific grading criteria (3-6 pts per criterion), JSON schema for totalScore + criteria + actionItems |
| `eaf_oral_debrief_prompt` | System prompt for oral debrief with 2/8/2/8 grid | `sessionId`, `phase?` | Generates prompt with baremes, compliance rules, JSON schema for phase-by-phase analysis |

---

## 5. MCP Client (Next.js App Side)

**Files:** `src/lib/mcp/client.ts`, `src/lib/mcp/index.ts`

The app-side MCP client (`NexusMCPClient`) is a singleton HTTP client that calls the MCP server via JSON-RPC 2.0 over `POST /mcp`.

**Fluent API groups:**
- `mcpClient.student.{getProfile, updateSkillMap, getErrorBank, scheduleRevision, getStudyPlan}`
- `mcpClient.rag.{search, getChunk}`
- `mcpClient.compliance.{checkPolicy, logEvent}`
- `mcpClient.billing.{getSubscription, getUsage}`
- `mcpClient.evaluation.{getCorrection, saveEvaluation, getOralSession}`
- `mcpClient.planning.{generatePlan, markTaskComplete}`
- `mcpClient.analytics.{getWeeklyStats, getSkillDelta, generateReport}`

Each call injects `_meta` with `agentSkill`, `studentId`, and `requestId` for server-side auth/logging.

---

## 6. LLM Router & Provider Configuration

### 6.1 Provider Interface

**File:** `src/lib/llm/provider.ts`

```typescript
interface LLMProvider {
  generateContent(promptOrMessages: string | ProviderChatMessage[], options?: GenerateContentOptions): Promise<GenerateContentResult>;
  getEmbeddings(text: string): Promise<number[]>;
}
```

All 4 providers implement this interface.

### 6.2 Provider Adapters

| Provider | File | Generation Model | Embedding Model | Features |
|----------|------|------------------|-----------------|----------|
| **Mistral** | `src/lib/llm/adapters/mistral.ts` | 5 tiers (see below) | `mistral-embed` | OpenAI-compatible SDK, streaming via `generateStream()`, health check, auth/rate/unavailable error classes |
| **Gemini** | `src/lib/llm/adapters/gemini.ts` | `gemini-1.5-pro` | `text-embedding-004` | Google Generative AI SDK |
| **OpenAI** | `src/lib/llm/adapters/openai.ts` | `gpt-4o` | `text-embedding-3-small` | OpenAI SDK (uses `responses.create` API) |
| **Ollama** | `src/lib/llm/adapters/ollama.ts` | `llama3.1:70b` (configurable) | `nomic-embed-text` | Local, retry with backoff, streaming, dual embedding endpoint fallback (`/api/embeddings` then `/api/embed`), health check |

### 6.3 Mistral Model Tiers

| Tier | Model | Env Override | Description |
|------|-------|-------------|-------------|
| `reasoning` | `magistral-medium-latest` | `MISTRAL_REASONING_MODEL` | Complex multi-axis analysis |
| `large` | `mistral-large-latest` | `MISTRAL_LARGE_MODEL` | Multi-text comparison, long context |
| `standard` | `mistral-small-latest` | `MISTRAL_SMALL_MODEL` | Interactive coaching, conversation |
| `micro` | `ministral-8b-latest` | `MISTRAL_MICRO_MODEL` | Lightweight tasks, short responses |
| `ocr` | `mistral-ocr-latest` | `MISTRAL_OCR_MODEL` | OCR from images/PDF |

### 6.4 Skill-to-Tier Routing

**File:** `src/lib/llm/router.ts`

**40+ skills mapped across 5 tiers:**

| Tier | Skills |
|------|--------|
| **reasoning** | correcteur, diagnosticien, avocat_diable, self_reflection, coach_ecrit_correction, coach_oral_final, ecrit_diagnostic, ecrit_baremage, oral_bilan_officiel, examinateur_virtuel |
| **large** | analyse_oeuvre_complete, comparaison_multi_textes, ecrit_essai, ecrit_contraction |
| **standard** | tuteur_libre, bibliothecaire, coach_oral, coach_ecrit, quiz_maitre, rapport_auto, langue, ecrit_langue, ecrit_plans, oral_tirage, coach_lecture, coach_explication, oral_entretien, grammaire_ciblee, oral_prep30, pastiche, quiz_adaptatif, revision_fiches, citations_procedes, carnet_lecture, support_produit |
| **micro** | planner, student_modeler, rappel_agent, quiz_simple, reformulation, suggestion_parcours, summary_session, validation_grammaticale, notification_content, spaced_repetition, sr_planner |
| **ocr** | ocr_copie |

### 6.5 Context-Aware Tier Adjustment

- Context > 100k tokens: `reasoning` downgrades to `large`
- Context > 8k tokens: `micro` upgrades to `standard`
- Image input + local tier: upgrades to `micro`
- Missing `MISTRAL_API_KEY`: all tiers fall back to `local` (Ollama)

### 6.6 Circuit Breaker

- **Window:** 5 minutes
- **Threshold:** 3 errors to open circuit
- **Fallback chain:** `reasoning` -> `large` -> `standard` -> `micro` -> `local` -> `local`
- State managed in-memory via `Map<MistralTier, CircuitState>`

### 6.7 Multi-Provider Fallback Cascade

**File:** `src/lib/llm/router.ts` — `routeLLM()`

**Default order:** `gemini -> openai -> mistral -> ollama` (configurable via `LLM_PROVIDER_ORDER` env)
**Timeout:** 15s per provider (configurable via `LLM_TIMEOUT_MS`)
**Behavior:** each provider is tried in order; on timeout or error, moves to next provider. Skips providers without API keys.
**Toggle:** `LLM_MULTI_PROVIDER_FALLBACK` env (default: enabled unless set to `'false'`)

### 6.8 Factory

**File:** `src/lib/llm/factory.ts`

- `getLLMProvider()` returns the **embedding** provider (Mistral if key present, else Ollama)
- Re-exports all router functions for single import point
- Caches provider instances

---

## 7. LLM Cost Tracking

**File:** `src/lib/llm/cost-tracker.ts`

### 7.1 Pricing Table (cents per million tokens)

| Model | Input | Output | Description |
|-------|-------|--------|-------------|
| `magistral-medium-latest` | 200 | 600 | Reasoning EAF |
| `mistral-large-latest` | 200 | 600 | Long context |
| `mistral-small-latest` | 10 | 30 | Standard interactive |
| `ministral-8b-latest` | 10 | 10 | Micro volumetric |
| `mistral-ocr-latest` | 100 | 100 | OCR copies |
| `mistral-embed` | 10 | 0 | RAG embeddings |
| `ollama` | 0 | 0 | Local free |

### 7.2 Cost Benchmarks (cents per operation)

| Operation | Estimated Cost |
|-----------|---------------|
| Correction de copie | 25c |
| Diagnostic initial | 15c |
| Rapport hebdo | 8c |
| Message tuteur | 0.3c |
| Quiz adaptatif | 0.5c |
| OCR copie | 5c |
| **Total mensuel/eleve** | **22c** |

### 7.3 Budget Alerts

- **Toggle:** `LLM_COST_TRACKING=true`
- **Daily threshold:** `MISTRAL_DAILY_BUDGET_EUR` (default 5 EUR)
- **Monthly threshold:** `MISTRAL_MONTHLY_BUDGET_EUR` (default 50 EUR)
- Checks every 100 calls; logs to `LlmBudgetAlert` table
- Sends email alert to `ADMIN_EMAIL` via transactional email when exceeded
- Anomaly warning for single calls > 50 cents

### 7.4 Reporting

`getLlmCostReport()` provides aggregated reporting by model, skill, tier, with top-10 cost skills and avg cost per active student.

---

## 8. LLM Orchestrator

**File:** `src/lib/llm/orchestrator.ts`

The `orchestrate()` function is the central pipeline for all LLM interactions:

### 8.1 Pipeline Steps

1. **Anti-triche check** on user input (blocks if disallowed)
2. **Parallel loading** of memory profile + media context
3. **Prompt assembly:** SYSTEM_PROMPT_EAF + skill instruction + student context + memory context + RAG context + media context + user query
4. **Token estimation** and provider selection via router
5. **Quota check** (`checkLLMQuota`)
6. **LLM generation** with JSON response format
7. **Post-generation compliance** (anti-triche on output)
8. **JSON extraction** from raw text (handles markdown code blocks)
9. **Output validation** (no external URLs, no emotional inference)
10. **Schema validation** against skill-specific Zod schema
11. **Cost tracking** to `LlmCostLog`
12. **Memory persistence** (AgentInteraction + WorkMastery updates)
13. **Fallback** to static skill output on any error (JSON parse, Zod, provider)

### 8.2 Signal Extraction

After successful generation, the orchestrator extracts pedagogical signals from the output:
- `feedbackScore` / `feedbackMax` / `feedbackLabel`
- `strongThemes[]` / `weakThemes[]`
- `citationsKnown[]`

These are persisted via `createAgentInteractionRecord` and `touchWorkMastery`.

---

## 9. LLM Skills (29 registered)

**File:** `src/lib/llm/skills/types.ts`, `src/lib/llm/skills/index.ts`

Each skill defines: `prompt` (system instruction), `outputSchema` (Zod), `fallback` (static default).

| # | Skill Key | Category | Router Tier |
|---|-----------|----------|-------------|
| 1 | `bibliothecaire` | RAG/Search | standard |
| 2 | `coach_ecrit` | Writing coaching | standard |
| 3 | `coach_oral` | Oral coaching | standard |
| 4 | `correcteur` | Copy correction | reasoning |
| 5 | `quiz_maitre` | Quiz generation | standard |
| 6 | `tuteur_libre` | Free tutoring | standard |
| 7 | `oral_tirage` | Oral text selection | standard |
| 8 | `coach_lecture` | Reading coaching | standard |
| 9 | `coach_explication` | Linear explanation | standard |
| 10 | `grammaire_ciblee` | Targeted grammar | standard |
| 11 | `oral_entretien` | Oral interview | standard |
| 12 | `oral_bilan_officiel` | Official oral report | reasoning |
| 13 | `ecrit_diagnostic` | Written diagnostic | reasoning |
| 14 | `ecrit_plans` | Essay plan generation | standard |
| 15 | `ecrit_contraction` | Text contraction | large |
| 16 | `ecrit_essai` | Essay exercise | large |
| 17 | `ecrit_langue` | Language exercises | standard |
| 18 | `ecrit_baremage` | Grading by rubric | reasoning |
| 19 | `revision_fiches` | Revision cards | standard |
| 20 | `quiz_adaptatif` | Adaptive quiz | standard |
| 21 | `spaced_repetition` | Spaced repetition | micro |
| 22 | `oral_prep30` | 30-min oral prep | standard |
| 23 | `citations_procedes` | Citations & devices | standard |
| 24 | `carnet_lecture` | Reading journal | standard |
| 25 | `sr_planner` | SR session planner | micro |
| 26 | `support_produit` | Product support | standard |
| 27 | `examinateur_virtuel` | Virtual examiner | reasoning |
| 28 | `pastiche` | Pastiche exercise | standard |
| 29 | `langue_generator` | Language exercise gen | standard |

---

## 10. Prompt Templates

### 10.1 System Prompt

**File:** `src/lib/llm/prompts/system.ts`

**10 absolute rules** injected into every agent call:
1. Never provide external URLs or site names
2. Never write a complete essay/commentary for the student
3. Anchor every claim on RAG context with `[Source: title]`
4. Use informal "tu", encouraging but demanding
5. Responses 150-400 words unless skill requires otherwise
6. Honestly state when information is not in RAG context
7. Always respond in strict valid JSON per skill schema
8. No filler -- every sentence must add pedagogical value
9. Adapt language level to estimated student level
10. All information exclusively from RAG context or general French literature knowledge

### 10.2 Context Blocks

Three context blocks are built and injected:
- `buildStudentContextBlock()` — student profile, level, scores, current work
- `buildRagContextBlock()` — RAG search results or "no documents provided"
- `buildMemoryContextBlock()` — student memory (confidential, not to be cited directly)

---

## 11. Self-Reflection

**File:** `src/lib/llm/self-reflection.ts`

`selfReflectCorrection()` sends a generated correction to a second LLM pass (using `self_reflection` skill, routed to `reasoning` tier) to verify:
- No emotional inference
- No complete essay written for student
- Coherent score
- Actionable feedback
- High school level appropriate

Returns `{ validated, correction, issues? }`. Times out after 15s. On failure, returns original correction as-is.

---

## 12. RAG Integration

### 12.1 Architecture Overview

| Layer | File | Description |
|-------|------|-------------|
| Vector search | `src/lib/rag/vector-search.ts` | pgvector cosine distance queries via Prisma raw SQL |
| Chunker | `src/lib/rag/chunker.ts` | 400-600 token chunks with 80-token overlap, sentence-boundary splitting |
| Reranker | `src/lib/rag/rerank.ts` | Reciprocal Rank Fusion (RRF, k=60) + metadata boost (+0.2 same oeuvre, +0.1 same parcours) |
| Citations | `src/lib/rag/citations.ts` | Converts search results to `{title, source_interne, snippet}` format; never exposes URLs to LLM |
| Local indexer | `src/lib/rag/indexer.ts` | Non-destructive batch indexing with batchId; disabled in production |
| Ingestion pipeline | `src/lib/rag/ingestion/pipeline.ts` | Production pipeline: text cleaning, semantic chunking, batch embedding, hash-based dedup, pgvector INSERT |
| Media indexer | `src/lib/rag/media-indexer.ts` | (not audited in detail) |
| Embeddings | `src/lib/llm/embeddings.ts` | Dimension normalization (default 1024), `toVectorLiteral()` for pgvector |

### 12.2 MCP RAG Tool (`eaf_search_corpus`)

Full hybrid search implementation in `packages/mcp-server/src/tools/rag/search-corpus.ts`:

1. **Embedding generation** via Ollama (`nomic-embed-text`)
2. **Vector search** via pgvector `<=>` operator with 0.3 similarity threshold
3. **Lexical search** via PostgreSQL `to_tsvector('french')` + `plainto_tsquery`
4. **Merge & deduplicate** by chunk ID
5. **Reranking:** authority A bonus (+0.2), query term presence in excerpt (+0.05/term)
6. **Authority enforcement:** if `requireAuthorityA=true` and no A-level source found, returns empty

### 12.3 Search Modes

| Mode | Trigger |
|------|---------|
| `hybrid` | Both vector and lexical succeed |
| `vector_only` | Vector succeeds but lexical not merged |
| `lexical_fallback` | pgvector unavailable, pure PostgreSQL full-text |

### 12.4 Authority Levels

| Level | Description | Examples |
|-------|-------------|---------|
| A | Official text (BO, programmes) | Bulletin Officiel, Eduscol |
| B | Semi-official (rapport jury) | Jury reports |
| C | Published works, official exams | Oeuvres, annales |
| D | Methodological resources | Glossaires, methodo |

### 12.5 Document Types

`bareme`, `programme`, `annale`, `methodologie`, `oeuvre`, `autre`

### 12.6 Ingestion Pipeline (Production)

**File:** `src/lib/rag/ingestion/pipeline.ts`

- `ingestDocument()` — single document: clean -> semantic chunk -> batch embed -> pgvector INSERT with hash-based dedup
- `ingestDocumentFromFile()` — reads .txt/.md files
- `bulkIngest()` — processes multiple documents with progress logging
- Supports rich metadata: `sourceType`, `authorityLevel`, `legalBasis`, `workId`, `parcoursId`, `voie`, `annee`

---

## 13. Compliance Rules (Policy Gate)

**File:** `packages/mcp-server/src/lib/policy-gate.ts`

9 immutable rules (header: "NE JAMAIS MODIFIER SANS VALIDATION LEGALE"):

| Rule | Description | Severity | Detection |
|------|-------------|----------|-----------|
| R-AIACT-01 | No emotional inference (AI Act education systems) | **block** | Regex: "tu sembles stresse", "je sens que tu", etc. |
| R-AIACT-02 | No proctoring or behavioral surveillance | **block** | Regex: "surveill", "proctoring", "detect triche" |
| R-FRAUD-01 | No complete essay writing in exam mode | **block** | Word count > 180 + essay structure detected + exam mode |
| R-RGPD-01 | Parental consent required for minors < 15 | warn | Age check, logs for audit trail |
| R-RGPD-02 | Data minimization and purpose limitation | structural | No pattern matching (architectural) |
| R-COPY-01 | No full ingestion of copyrighted works | structural | Enforced in `eaf_index_document` tool |
| R-COPY-02 | Excerpts require `legal_basis` field | structural | Schema enforcement |
| R-CITE-01 | Normative responses must cite official sources | warn | Detects normative content without `[Source:]` citation |
| R-SCOPE-01 | Platform covers voie generale only | warn | Regex: "voie technologique", "bac pro", etc. |

**Sanitization:** For `warn` violations, R-AIACT-01 patterns are automatically removed from output.

---

## 14. Memory & Student Profile System

### 14.1 Memory Store (Auth)

**File:** `src/lib/memory/store.ts`

Authentication-level store for users, sessions, and memory events. Uses Prisma with fallback to JSON file (`fallback-store.ts`). This is **not** the pedagogical memory store.

### 14.2 Scoring Helpers

**File:** `src/lib/memory/scoring.ts`

Pure functions for the pedagogical memory system:

| Function | Description |
|----------|-------------|
| `updateSkillScore()` | Weighted Moving Average (WMA) with 30% recency weight |
| `computeWeakSeverity()` | `frequency x recency` -> LOW/MEDIUM/HIGH/CRITICAL |
| `applyDecay()` | Daily decay factor 0.97; marks as IMPROVING when < 0.3 |
| `computeSkillTrend()` | Compares avg of last 3 vs previous 3 observations -> IMPROVING/STABLE/DECLINING |
| `computeConfidence()` | Logarithmic confidence from observation count, capped at 1.0 after ~20 observations |
| `estimateGlobalLevel()` | Maps avg score to INSUFFISANT/PASSABLE/SATISFAISANT/EXCELLENT |
| `shouldCreateWeakSkill()` | Triggers WeakSkill creation if same error >= 3 times in 30 days |

### 14.3 Learning Memory Repository

**File:** `src/lib/db/repositories/learningMemoryRepo.ts`

Persistent pedagogical memory backed by Prisma:

- `createAgentInteractionRecord()` — Records every agent interaction with input/output summaries, feedback scores, tokens used, latency, RAG sources count
- `touchWorkMastery()` — Upserts work-level mastery with WMA (70% existing + 30% new), tracks strong/weak themes, known citations (capped at 8/8/12)
- `refreshMemorySummaries()` — Generates 5 summary types (FULL, ORAL, ECRIT, RECENT_SESSIONS, WEAK_SKILLS) with 14-day validity

### 14.4 Student Modeler Agent

**File:** `src/lib/agents/student-modeler.ts`

`processInteraction()` pipeline:
1. Extracts skill updates from rubric criteria (maps criterion IDs to microSkillIds)
2. Applies explicit skill deltas
3. Persists detected errors to ErrorBank via `addErrorBankItem()`
4. Updates SkillMap via premium store
5. `extractErrorsFromRubric()` flags criteria scoring < 50% as errors

**Criterion-to-MicroSkill mapping:**
- problematique -> `ecrit_problematique`
- plan -> `ecrit_plan`
- citations -> `ecrit_citations`
- expression -> `ecrit_expression`
- transitions -> `ecrit_transitions`
- conclusion -> `ecrit_conclusion`
- lecture -> `oral_lecture`
- explication -> `oral_mouvements`
- grammaire -> `oral_grammaire`
- entretien -> `oral_entretien`

### 14.5 Student Profile Injection

The orchestrator injects student memory into every LLM call:

1. `loadMemoryProfileForUser()` loads the full `MemoryProfile`
2. `composeMemoryContext()` formats it for the target agent type
3. `truncateToTokenBudget()` ensures it fits within token limits
4. Injected as `=== MEMOIRE ELEVE (confidentiel) ===` block in the prompt

### 14.6 SkillMap Structure (5 Axes)

| Axis | Description |
|------|-------------|
| `ecrit` | Written composition skills (problematique, plan, citations, expression, transitions, conclusion) |
| `oral` | Oral exam skills (lecture, mouvements/explication, grammaire, entretien) |
| `langue` | Language mastery (grammar, syntax, conjugation, vocabulary) |
| `oeuvres` | Literary work knowledge (themes, characters, citations, context) |
| `methode` | Methodology (essay structure, commentary structure, oral preparation) |

Each axis entry: `{ axis, score [0-1], lastUpdated, trend (up/down/stable) }`

### 14.7 ErrorBank & Spaced Repetition

**Severity-based revision schedule:**

| Severity | Schedule (days) |
|----------|-----------------|
| minor | J+7, J+21 |
| major | J+2, J+7, J+21 |
| critical | J+1, J+3, J+7, J+21 |

**Error types tracked:** contresens, hors_sujet, problematique_floue, plan_desequilibre, citation_incorrecte, analyse_superficielle, registre_incorrect, grammaire_conjugaison, grammaire_syntaxe, procede_mal_nomme, oral_debit, oral_couverture_mouvements, oral_hors_temps

---

## 15. Key Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MCP_TRANSPORT` | `stdio` | Transport mode: `stdio` or `http` |
| `MCP_PORT` | `3100` | HTTP transport port |
| `MCP_API_KEY` | (none) | Required for HTTP transport auth |
| `MCP_RATE_LIMIT_PER_MINUTE` | `100` | Max tool calls per student per minute |
| `LLM_ROUTER_ENABLED` | `false` | Enable Mistral multi-tier router (falls back to Ollama if false) |
| `LLM_MULTI_PROVIDER_FALLBACK` | `true` | Enable cascade fallback across providers |
| `LLM_PROVIDER_ORDER` | `gemini,openai,mistral,ollama` | Fallback order |
| `LLM_TIMEOUT_MS` | `15000` | Timeout per provider in cascade |
| `LLM_COST_TRACKING` | `false` | Enable cost tracking to DB |
| `MISTRAL_API_KEY` | (none) | Mistral API key |
| `GEMINI_API_KEY` | (none) | Google Gemini API key |
| `OPENAI_API_KEY` | (none) | OpenAI API key |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_MODEL` | `llama3.1:70b` | Ollama generation model |
| `OLLAMA_EMBEDDING_MODEL` | `nomic-embed-text` | Ollama embedding model |
| `RAG_EMBEDDING_DIMENSION` | `1024` | pgvector embedding dimension |
| `RAG_CHUNK_SIZE` | `500` | Target chunk size in tokens |
| `MISTRAL_DAILY_BUDGET_EUR` | `5` | Daily budget alert threshold |
| `MISTRAL_MONTHLY_BUDGET_EUR` | `50` | Monthly budget alert threshold |

---

## 16. Findings & Observations

### 16.1 Strengths

1. **Comprehensive MCP tool coverage:** 19 tools covering student profiling, RAG search, evaluation, planning, analytics, compliance, and billing
2. **Real implementations:** 13/19 tools are fully DB-backed; no pure stubs
3. **Multi-layer compliance:** Policy gate with 9 rules, anti-triche classification, output validation, and self-reflection pass
4. **Multi-provider resilience:** 4 LLM providers with circuit breaker, cascade fallback, and per-provider timeout
5. **Cost tracking:** Per-call cost logging with daily/monthly budget alerts and email notifications
6. **Agent scope isolation:** Each agent type has a strict whitelist of allowed tools
7. **Production-grade RAG:** Hybrid vector+BM25 search, authority-based reranking, hash-based dedup, semantic chunking with overlap

### 16.2 Gaps & Risks

1. **Partial tool implementations:** `eaf_generate_plan` returns empty days, `eaf_get_oral_session` returns empty phases, `eaf_generate_report` has no worker. Badge checking is stubbed.
2. **MCP search_corpus embedding uses Ollama** while app-side RAG uses factory (Mistral or Ollama). Dimension mismatch risk if different embedding models produce different dimensions.
3. **No end-to-end encryption** of student data between Next.js app and MCP server (HTTP with Bearer token only).
4. **Circuit breaker state is in-memory only** -- resets on process restart; not shared across PM2 cluster instances.
5. **Rate limiting key uses minute-floor** (`Math.floor(Date.now() / 60000)`), so the actual window can be as short as 1ms if a request arrives at the boundary.
6. **HTTP transport `handleJsonRpc`** accesses private `_requestHandlers` map on the MCP Server object via unsafe cast -- brittle across SDK version upgrades.
7. **Self-reflection** adds latency to correction pipeline but silently passes original on timeout/failure -- no metric on how often it catches issues.
