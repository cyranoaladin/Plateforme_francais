# Audit V9 Lot 1 Billing + Backend Oral Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre les quotas Redis atomiques, unifier la logique d'évaluation/persistance des phases orales texte/audio, et réaligner le MCP sur les sources SSOT billing/programme.

**Architecture:** Le lot introduit une primitive partagée `evaluateAndPersistPhase()` côté backend oral, puis remplace le duo `checkQuota`/`consumeQuota` par une base atomique Redis scriptée pour les plans limités. Enfin, le MCP arrête de dupliquer les plans et le programme littéraire en important les sources canon.

**Tech Stack:** Next.js App Router, TypeScript strict, Prisma, Redis/ioredis, Vitest, MCP server TypeScript.

---

### Task 1: Écrire les garde-fous du lot 1

**Files:**
- Create: `tests/unit/oral/evaluate-and-persist.test.ts`
- Modify: `tests/unit/billing/quota-atomicity.test.ts`
- Modify: `tests/unit/api/oral-audio-turn.test.ts`
- Modify: `packages/mcp-server/tests/all-tools.test.ts`

- [ ] Écrire un test qui vérifie que `evaluateAndPersistPhase()` applique quotas + persistance pour texte/audio.
- [ ] Étendre le test d’atomicité quota pour confirmer qu’un seul des deux appels concurrents passe.
- [ ] Ajouter une assertion sur la consommation `LLM_TOKENS` dans la route `audio-turn`.
- [ ] Ajouter un test MCP qui vérifie l’usage du programme 2025-2026 et l’absence de limites hardcodées divergentes.

### Task 2: Introduire la primitive partagée d’évaluation orale

**Files:**
- Create: `src/lib/oral/evaluate-and-persist.ts`
- Modify: `src/app/api/v1/oral/session/[sessionId]/interact/route.ts`
- Modify: `src/app/api/v1/oral/session/[sessionId]/audio-turn/route.ts`

- [ ] Extraire `PHASE_TOKEN_COST` dans la primitive partagée.
- [ ] Déplacer dans cette primitive: fetch profil si nécessaire, `evaluateOralPhase`, `consumeQuota(LLM_TOKENS)`, `appendOralInteraction`, `createMemoryEventRecord`.
- [ ] Faire consommer `interact` et `audio-turn` par cette primitive sans régression de statut ou de réponse API.

### Task 3: Rendre les quotas Redis atomiques

**Files:**
- Modify: `src/lib/billing/usage.ts`
- Modify: `src/app/api/v1/billing/check-quota/route.ts`
- Modify: `tests/unit/billing/quotas.test.ts`
- Modify: `tests/unit/billing/quota-atomicity.test.ts`

- [ ] Introduire un script Lua atomique pour `check+consume`.
- [ ] Court-circuiter Redis pour les quotas `unlimited` et `0`.
- [ ] Adapter `checkQuota()` et `consumeQuota()` pour partager cette base atomique sans casser les call sites existants.
- [ ] Vérifier les routes qui appellent `checkQuota()` pour conserver la forme de réponse attendue.

### Task 4: Réaligner le MCP sur les sources SSOT

**Files:**
- Modify: `packages/mcp-server/src/tools/all-tools.ts`
- Modify: `packages/mcp-server/package.json` si nécessaire pour résoudre l’import
- Modify: `packages/mcp-server/tests/all-tools.test.ts`
- Reference: `src/lib/billing/plan-catalog.ts`
- Reference: `src/data/oeuvres-programme.ts`

- [ ] Supprimer `PLAN_LIMITS` inline et dériver les limites depuis `PLAN_CATALOG`.
- [ ] Remplacer `getProgramme2026` hardcodé par la liste canonique issue de `src/data/oeuvres-programme.ts`.
- [ ] Conserver la compatibilité des aliases legacy de plans (`MONTHLY`, `MAX`, `LIFETIME`).

### Task 5: Validation complète du lot 1

**Files:**
- Update baseline if needed: `config/fr-copy-baseline.json`

- [ ] Run: `npx tsc --noEmit`
- [ ] Run: `npm run lint`
- [ ] Run: `npm run check:quotes`
- [ ] Run: `npm run ci:audit-csrf`
- [ ] Run: `npm run ci:fr-copy` (regen baseline if needed)
- [ ] Run: `npx vitest run tests/unit`
- [ ] Run: `npx vitest run tests/integration`
- [ ] Run: `npm run build:ci`
