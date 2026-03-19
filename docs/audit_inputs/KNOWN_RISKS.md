# Known Risks — Nexus Réussite EAF

## Purpose

This file is for external auditors and remediation agents. It is intentionally blunt.

## Fausses pistes

- **BullMQ / worker absent**
  - false trail
  - `src/lib/queue/correction-queue.ts`, `src/lib/queue/worker.ts`, `src/lib/queue/start-worker.ts`, `ecosystem.config.cjs` already show a separate worker model

- **Rate limiting absent**
  - false trail
  - HTTP and LLM protections exist in `src/lib/security/rate-limit.ts` and `src/lib/security/llm-rate-limiter.ts`

- **MCP exposes 27 tools**
  - outdated assumption
  - current canonical docs and `packages/mcp-server/README.md` say `20`

- **Local storage still acceptable in production by default**
  - outdated assumption after recent hardening
  - current runtime/doc direction expects `STORAGE_PROVIDER=s3` in prod

## Fichiers bruyants ou trompeurs

- **`middleware.ts` and `proxy.ts` together**
  - high audit noise
  - both implement overlapping auth/security ideas
  - an external agent can easily overreact and “clean up” the wrong one

- **`src/lib/db/fallback-store.ts` and fallback-aware repositories**
  - presence of fallback code does not mean fallback is acceptable in production
  - must separate dev/test convenience from prod semantics

- **`prisma/schema.prisma`**
  - large, organically grown, includes addendum-style expansion
  - easy to misread as uniformly mature just because schema is rich

- **`docs/*`**
  - mostly strong and recent, but still documentation
  - do not treat counts, boundaries, or runtime assumptions as final without code proof

- **scripts under `scripts/`**
  - mixture of current operational scripts and more situational helpers
  - do not infer production truth from every helper script

## Artefacts historiques / temporaires

- `.env`, `.env.local`, `.env.backup` exist in repo workspace context
  - do not treat local values as authoritative architecture
- runtime logs at repo root (`mcp.log`, `next.log`, `*_dev*.log`)
  - operational noise, not design truth
- `coverage/`, `test-results/`, `.vitest-unit-report.json`
  - verification artifacts, not architecture
- old assumptions from previous audits may still circulate mentally even if canonical docs were consolidated on 14 March 2026

## Zones où la lecture naïve induit en erreur

- **Auth is not just one layer**
  - app-level access control is spread across route handlers, session helpers, CSRF checks, and request gate files
- **Teacher safety is not solved by `requireUserRole('enseignant')` alone**
  - route-level data scope still matters
- **`FREE` fallback in billing context is not automatically a bug**
  - some fallback is intended product behavior, not a defect
- **queue fallback code exists**
  - but prod behavior is stricter than dev/test behavior
- **scheduler code exists locally**
  - but production intent is route-triggered cron with secrets
- **MCP health route exists in app**
  - that does not mean MCP should be public
- **rich schema does not equal coherent module boundaries**
  - schema breadth hides some coupling and historical layering

## Écarts docs / code à surveiller

- route/tool/file counts may drift after recent work
- documentation is canonical but not self-proving
- some hardening decisions landed after earlier narratives and may not be reflected everywhere in prose yet
- `middleware.ts` vs `proxy.ts` is the most obvious place where documentation may under-specify runtime reality

## Conventions implicites non triviales

- cookie session is the trusted identity source; request payload identifiers are not
- production behavior tends to fail closed for Redis/security/quota-sensitive paths
- local/dev convenience behavior should not be generalized to production
- canonical docs are the preferred documentation layer; do not create a competing documentation center casually
- recent hardening is intentional even if it looks strict or inconvenient

## Decisions récentes de durcissement qu’un agent pourrait casser par “nettoyage”

- refusing local storage in production
- stricter env validation in `scripts/check-env.js`
- stricter payment callback acceptance rules
- `503` behavior instead of silent fallback in some production-sensitive paths
- PM2 memory increases for `eaf-nextjs` and `eaf-worker`
- explicit MCP internal-only deployment language

## Erreurs typiques qu’un agent externe pourrait commettre sur ce dépôt

- deleting fallback-related code without checking whether it still supports dev/test intentionally
- merging `middleware.ts` and `proxy.ts` too early without proving actual runtime semantics
- downgrading prod hardening because it looks too strict in local development
- rewriting payment code around generic best practices without first preserving current business rules and idempotency
- assuming teacher routes are safe because they return `403` for wrong roles, while missing scope leaks
- treating docs as marketing material instead of recent technical references
- treating docs as perfect truth and skipping code validation
- trying to “normalize” the project into a generic SaaS template, losing exam-specific and agent-specific constraints
- over-refactoring Prisma/repository layers before identifying the truly critical flows
- exposing MCP more directly during cleanup or local setup simplification
