# Audit Brief — Nexus Réussite EAF

## Scope

Audit target: `/home/alaeddine/Documents/Plateforme_Francais/eaf_platform`

Primary canonical docs:
- `README.md`
- `docs/00_INDEX.md`
- `docs/01_SYSTEME_COMPLET.md`
- `docs/02_API_REFERENCE_COMPLETE.md`
- `docs/03_TECHNIQUE_DONNEES_IA_MCP.md`
- `docs/04_EXPLOITATION_TESTS_DEPLOIEMENT.md`
- `docs/05_ARBORESCENCE_COMPLETE.md`
- `packages/mcp-server/README.md`

Rule of interpretation:
- code is final authority if code and docs diverge
- canonical docs are recent and useful, but still must be checked against live code
- old audits and historical assumptions must not be treated as truth without recross-checking

## Project Overview

Nexus Réussite EAF is a French exam-prep platform built as a `Next.js 16` monolith with App Router, versioned HTTP APIs under `src/app/api/v1`, a separate `packages/mcp-server` workspace, `Prisma/PostgreSQL` persistence, `Redis` for quotas/rate-limiting/queueing, `BullMQ` for correction jobs, and production-oriented scripts under `scripts/`.

Core product surfaces:
- public/marketing entry: `src/app/page.tsx`, `src/app/(public)/landing/page.tsx`
- authenticated student cockpit: `/dashboard`, `/onboarding`, `/tuteur`, `/atelier-ecrit`, `/atelier-oral`, `/atelier-langue`, `/quiz`, `/bibliotheque`, `/carnet`, `/descriptif`
- teacher/parent surfaces: `/enseignant`, `/parent`
- billing and checkout: `/pricing`, `/paiement/*`, `src/app/api/v1/payments/clictopay/*`

## Architecture réelle

### Confirmed in code

- **Application shell**
  - `next` app in `src/app`
  - route handlers in `src/app/api/v1`
  - shared logic in `src/lib`
- **Authentication model**
  - cookie session in `src/lib/auth/session.ts`
  - role guard in `src/lib/auth/guard.ts`
  - login/register/reset flows in `src/app/api/v1/auth/*`
- **Persistence**
  - `Prisma` schema in `prisma/schema.prisma`
  - repositories under `src/lib/db/repositories/*`
- **Billing / quotas**
  - plan resolution in `src/lib/billing/context.ts`
  - quota enforcement in `src/lib/billing/usage.ts`
  - billing endpoints in `src/app/api/v1/billing/*`
- **Payments**
  - ClicToPay integration in `src/lib/payments/clictopay.ts`
  - init/callback/status/public-status routes in `src/app/api/v1/payments/clictopay/*`
- **Async correction pipeline**
  - queue in `src/lib/queue/correction-queue.ts`
  - worker in `src/lib/queue/worker.ts`
  - worker entrypoint in `src/lib/queue/start-worker.ts`
  - PM2 process in `ecosystem.config.cjs`
- **Storage**
  - provider selection in `src/lib/storage/provider.ts`
  - file saving in `src/lib/storage/copies.ts`
  - media/resource access in `src/app/api/v1/ressources/file/route.ts` and `src/app/api/v1/media/[id]/route.ts`
- **Oral domain**
  - stateful oral flows under `src/app/api/v1/oral/*`
  - service/state/scoring in `src/lib/oral/service.ts`, `src/lib/oral/state-machine.ts`, `src/lib/oral/scoring.ts`
- **Cron**
  - scheduler in `src/lib/cron/scheduler.ts`
  - production cron routes in `src/app/api/v1/cron/*`
- **MCP**
  - separate workspace in `packages/mcp-server`
  - app-side client in `src/lib/mcp/client.ts`
  - internal health bridge in `src/app/api/mcp/health/route.ts`
- **Security headers / auth gate layer**
  - `middleware.ts`
  - `proxy.ts`
  - both exist and must be read together, not assumed equivalent

### Probable / to verify

- **Active request gating path between `middleware.ts` and `proxy.ts`**
  - both files implement auth/security logic
  - an auditor must verify which one is authoritative at runtime for the current Next.js setup
- **Some docs/counts may lag the live repo after recent edits**
  - the docs are consolidated and recent, but still should be recross-checked with route/file counts
- **Some fallback codepaths may remain in dev/test only**
  - several modules historically supported degraded local behavior
  - production hardening was added recently, but an auditor should verify every residual fallback path

### Historical / potentially obsolete

- any claim that the correction worker is still only in-process in production
- any claim that Redis-based rate limiting is absent
- any claim that MCP exposes `27` tools; current canonical docs and MCP README say `20`
- any assumption that local storage is acceptable in production by default; recent hardening now expects `STORAGE_PROVIDER=s3` in prod

## High-value entry points

### Front / page entry points
- `src/app/page.tsx`
- `src/app/(public)/landing/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/onboarding/page.tsx`
- `src/app/tuteur/page.tsx`
- `src/app/atelier-ecrit/page.tsx`
- `src/app/atelier-oral/page.tsx`
- `src/app/atelier-langue/page.tsx`
- `src/app/quiz/page.tsx`
- `src/app/enseignant/page.tsx`

### Critical API entry points
- auth
  - `src/app/api/v1/auth/register/route.ts`
  - `src/app/api/v1/auth/login/route.ts`
  - `src/app/api/v1/auth/logout/route.ts`
  - `src/app/api/v1/auth/me/route.ts`
  - `src/app/api/v1/auth/forgot-password/route.ts`
  - `src/app/api/v1/auth/reset-password/route.ts`
- billing / payments
  - `src/app/api/v1/billing/status/route.ts`
  - `src/app/api/v1/billing/check-quota/route.ts`
  - `src/app/api/v1/billing/redeem-code/route.ts`
  - `src/app/api/v1/payments/clictopay/init/route.ts`
  - `src/app/api/v1/payments/clictopay/callback/route.ts`
  - `src/app/api/v1/payments/clictopay/status/route.ts`
  - `src/app/api/v1/payments/clictopay/public-status/route.ts`
- teacher scope
  - `src/app/api/v1/enseignant/dashboard/route.ts`
  - `src/app/api/v1/enseignant/export/route.ts`
  - `src/app/api/v1/enseignant/class-code/route.ts`
  - `src/app/api/v1/enseignant/corrections/[copieId]/comment/route.ts`
- written exam / copies
  - `src/app/api/v1/epreuves/generate/route.ts`
  - `src/app/api/v1/epreuves/[epreuveId]/copie/route.ts`
  - `src/app/api/v1/epreuves/copies/[copieId]/file/route.ts`
  - `src/app/api/v1/epreuves/copies/[copieId]/report/route.ts`
- oral
  - `src/app/api/v1/oral/session/start/route.ts`
  - `src/app/api/v1/oral/session/[sessionId]/start-prep/route.ts`
  - `src/app/api/v1/oral/session/[sessionId]/end-prep/route.ts`
  - `src/app/api/v1/oral/session/[sessionId]/start-passage/route.ts`
  - `src/app/api/v1/oral/session/[sessionId]/interact/route.ts`
  - `src/app/api/v1/oral/session/[sessionId]/end/route.ts`
  - `src/app/api/v1/oral/jury-respond/route.ts`
  - `src/app/api/v1/oral/voice-submit/route.ts`
- cron / health / metrics
  - `src/app/api/v1/cron/revision-reminders/route.ts`
  - `src/app/api/v1/cron/session-cleanup/route.ts`
  - `src/app/api/v1/cron/weekly-reports/route.ts`
  - `src/app/api/v1/health/route.ts`
  - `src/app/api/v1/metrics/vitals/route.ts`
  - `src/app/api/mcp/health/route.ts`

## Critical modules

- **Auth / session / cookie security**
  - `src/lib/auth/session.ts`
  - `src/lib/auth/guard.ts`
  - `src/lib/security/csrf.ts`
  - `src/lib/security/rate-limit.ts`
- **DB / fallback / repositories**
  - `src/lib/db/client.ts`
  - `src/lib/db/fallback-store.ts`
  - `src/lib/db/repositories/*`
- **Billing / quota / plan gating**
  - `src/lib/billing/context.ts`
  - `src/lib/billing/usage.ts`
  - `src/lib/billing/plan-catalog.ts`
- **Payments**
  - `src/lib/payments/clictopay.ts`
- **Queue / worker / Redis**
  - `src/lib/queue/correction-queue.ts`
  - `src/lib/queue/worker.ts`
  - `src/lib/queue/start-worker.ts`
- **Storage**
  - `src/lib/storage/provider.ts`
  - `src/lib/storage/copies.ts`
  - `src/lib/storage/s3-provider.ts`
- **LLM / RAG / MCP**
  - `src/lib/mcp/client.ts`
  - `src/lib/llm/*`
  - `src/lib/rag/*`
  - `packages/mcp-server/src/*`
- **Cron / notifications**
  - `src/lib/cron/scheduler.ts`
  - `src/lib/email/client.ts`
  - `src/lib/notifications/*`

## Structuring dependencies

Confirmed in `package.json`:
- `next@16.1.6`
- `react@19.2.3`
- `@prisma/client` / `prisma`
- `bullmq`
- `ioredis`
- `node-cron`
- `zod`
- `resend`
- `@aws-sdk/client-s3`
- `@google/generative-ai`
- `@mistralai/mistralai`
- `openai`
- `pino`
- `@playwright/test`
- `vitest`
- `@stryker-mutator/*`
- workspace package `packages/mcp-server`

## Sensitive files

- runtime / infra
  - `ecosystem.config.cjs`
  - `scripts/nginx-eaf.conf`
  - `scripts/deploy.sh`
  - `Dockerfile`
  - `.github/workflows/ci.yml`
  - `.github/workflows/ci-cd.yml`
- environment / sanity
  - `.env.example`
  - `scripts/check-env.js`
  - `packages/mcp-server/.env.example`
- persistence / contracts
  - `prisma/schema.prisma`
  - `prisma/migrations/*`
- security gate layer
  - `middleware.ts`
  - `proxy.ts`
- teacher / RBAC / export
  - `src/app/api/v1/enseignant/*`
- payments
  - `src/lib/payments/clictopay.ts`
  - `src/app/api/v1/payments/clictopay/*`
- queue / cron
  - `src/lib/queue/*`
  - `src/lib/cron/scheduler.ts`

## Implicit conventions

- use `getAuthenticatedUserId()` or `getAuthenticatedUser()` from session cookie; do not trust caller-supplied user ids
- mutating routes are expected to enforce CSRF
- Redis-backed protections tend to be fail-closed in production, permissive only in dev/test
- some modules still tolerate degraded behavior outside production; auditors must separate dev/test fallback from prod semantics
- teacher scope is not just a role check; class scoping and copy ownership matter
- canonical docs were consolidated recently and are meant to replace scattered historical docs
- recent production hardening should not be reverted under the guise of simplification

## Recent production hardening already present

Confirmed from code/docs/memory context and recent changes:
- local persistence fallback blocked in production in critical areas
- teacher dashboard/export return `503` instead of silently reading fallback persistence when DB is unavailable in prod
- transactional email is stricter in production when `RESEND_API_KEY` is missing
- `BILLING_CODE_PEPPER` required in production-sensitive billing flows
- `scripts/check-env.js` treats key production variables as mandatory, including `CLICTOPAY_USERNAME` and `CLICTOPAY_PASSWORD`
- ClicToPay callback denies requests in production when IP allowlist is not configured
- storage hardening now expects `STORAGE_PROVIDER=s3` in production
- PM2 memory was raised to `1536M` for `eaf-nextjs` and `1G` for `eaf-worker`
- docs now state MCP must remain local/internal and not public

## High-risk audit areas

- **auth gate layering**
  - `middleware.ts` and `proxy.ts` may create duplicated or diverging security behavior
- **teacher RBAC and scope**
  - role check alone is insufficient; inspect class scoping and export/comment routes
- **payment idempotency / callback hardening**
  - verify callback auth, replay resistance, allowlist behavior, and status transitions
- **queue / cron / async side effects**
  - verify what is prod-only, dev-only, and route-triggered vs background-triggered
- **fallback persistence residue**
  - verify no accidental prod read/write fallback remains in non-obvious repositories
- **storage semantics**
  - ensure all file-serving/upload paths respect the new prod storage assumptions
- **MCP boundary**
  - separate app concerns from MCP workspace concerns; audit auth, scope control, and network exposure
- **doc/code drift**
  - canonical docs are strong, but any concrete claim still needs code confirmation

## Ce que Claude ne doit pas supposer trop vite

- do not assume the first auth/security file you see is the only active one; `middleware.ts` and `proxy.ts` coexist
- do not assume a fallback path is active in production just because it exists in code
- do not assume all docs are wrong because some details may drift; canonical docs are recent and useful
- do not assume all docs are right either; verify high-impact claims in code
- do not assume teacher endpoints are safe because they use `requireUserRole('enseignant')`; scope still matters
- do not assume MCP is public-facing; intended deployment is internal-only
- do not assume every `FREE` fallback in billing is harmless; some are deliberate, some may hide availability problems
- do not assume `packages/mcp-server` is just ancillary; it is a real architectural subsystem
- do not assume route counts or tool counts from older notes; current canonical count is `20` MCP tools
- do not assume recent hardening should be “cleaned up” or relaxed without understanding why it was introduced

## Fast audit route

Recommended reading order for a second agent:
1. `README.md`
2. `docs/00_INDEX.md`
3. `AUDIT_BRIEF.md`
4. `docs/01_SYSTEME_COMPLET.md`
5. `docs/03_TECHNIQUE_DONNEES_IA_MCP.md`
6. `docs/04_EXPLOITATION_TESTS_DEPLOIEMENT.md`
7. `prisma/schema.prisma`
8. `package.json`
9. `src/lib/auth/session.ts`
10. `src/lib/auth/guard.ts`
11. `src/lib/billing/context.ts`
12. `src/lib/billing/usage.ts`
13. `src/lib/payments/clictopay.ts`
14. `src/lib/queue/correction-queue.ts`
15. `src/lib/cron/scheduler.ts`
16. `src/lib/mcp/client.ts`
17. `middleware.ts`
18. `proxy.ts`
19. `packages/mcp-server/README.md`
20. `KNOWN_RISKS.md`
