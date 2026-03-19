# Remediation Backlog — Nexus Réussite EAF

## Usage

This backlog is intentionally split between:
- **confirmed guardrails already in place that must not be broken**
- **candidate remediation topics that still require proof during audit**

Do not treat every item below as a confirmed defect. Some are explicit audit targets.

## Non-regression items already hardened

- keep production storage strict: `src/lib/storage/provider.ts`, `scripts/check-env.js`
- keep production queue behavior fail-safe: `src/lib/queue/correction-queue.ts`
- keep teacher dashboard/export strict in prod when DB is unavailable
- keep payment callback hardening and IP allowlist requirements
- keep production env sanity checks strict
- keep MCP internal-only deployment assumptions
- keep PM2 memory ceilings aligned with `ecosystem.config.cjs`

## P0

### Security / auth / permissions / prod blockers

- **Auth gate ambiguity**
  - files: `middleware.ts`, `proxy.ts`, `src/lib/auth/session.ts`, `src/lib/auth/guard.ts`
  - action: confirm which gate layer is authoritative, remove contradictory behavior only if proven safe
  - risk: duplicate or diverging auth/security enforcement
  - dependency: none

- **Teacher scope / RBAC audit and fix**
  - files: `src/app/api/v1/enseignant/dashboard/route.ts`, `src/app/api/v1/enseignant/export/route.ts`, `src/app/api/v1/enseignant/corrections/[copieId]/comment/route.ts`, `src/lib/auth/guard.ts`
  - action: verify role check plus class/data scope on every teacher route
  - risk: cross-student data exposure
  - dependency: auth gate review

- **Payment callback integrity**
  - files: `src/app/api/v1/payments/clictopay/callback/route.ts`, `src/lib/payments/clictopay.ts`
  - action: verify idempotency, source validation, status transition safety, replay behavior, allowlist enforcement
  - risk: billing state corruption or unauthorized callback execution
  - dependency: none

- **Quota / billing fail-closed semantics**
  - files: `src/lib/billing/context.ts`, `src/lib/billing/usage.ts`, `src/lib/security/llm-rate-limiter.ts`, `src/app/api/v1/billing/*`
  - action: verify every critical quotaed flow fails correctly in production when Redis/DB are unavailable
  - risk: free abuse or service denial with inconsistent user state
  - dependency: none

- **Async correction pipeline production safety**
  - files: `src/lib/queue/correction-queue.ts`, `src/lib/queue/worker.ts`, `src/lib/queue/start-worker.ts`, `ecosystem.config.cjs`
  - action: verify no hidden prod in-process fallback remains and worker lifecycle is operationally safe
  - risk: lost corrections, hidden sync fallback, stalled jobs
  - dependency: none

- **Cron execution model sanity**
  - files: `src/lib/cron/scheduler.ts`, `src/app/api/v1/cron/*`, `scripts/deploy.sh`, `ecosystem.config.cjs`
  - action: verify local scheduler vs production cron route behavior and auth via `CRON_SECRET`
  - risk: duplicate execution, missed jobs, unauthenticated cron triggers
  - dependency: none

- **Persistence fallback residue in prod-critical code**
  - files: `src/lib/db/client.ts`, `src/lib/db/fallback-store.ts`, `src/lib/db/repositories/*`, teacher routes, export flows, epreuves flows
  - action: verify that remaining fallback logic cannot silently serve prod data where it should fail
  - risk: stale data, hidden degradation, unsafe prod behavior
  - dependency: none

## P1

### Robustness / consistency / observability / CI-CD

- **Docs vs code reconciliation on critical claims**
  - files: all canonical docs + live code
  - action: reconcile any remaining drift on routes, counts, deployment assumptions, MCP details
  - impact: reduces audit noise and future operator mistakes

- **Validation consistency across API routes**
  - files: `src/app/api/v1/**/route.ts`, `src/lib/validation/*`
  - action: verify all mutating routes use shared parsing/validation and coherent error contracts
  - impact: avoids inconsistent 4xx/5xx behavior

- **Error handling normalization**
  - files: payment routes, oral routes, teacher routes, queue-backed routes
  - action: check for internal error leakage, inconsistent status codes, swallowed exceptions
  - impact: operational clarity and safer client behavior

- **Observability gaps**
  - files: `src/lib/logger.ts`, queue/cron/payment/oral modules, `.github/workflows/*`
  - action: assess whether logs/health/metrics are enough to debug production failures
  - impact: better incident response

- **CI coverage realism**
  - files: `.github/workflows/ci.yml`, `.github/workflows/ci-cd.yml`, `package.json`, `tests/*`
  - action: verify what CI truly runs versus what is merely available locally
  - impact: reduces false confidence

- **Storage/file serving consistency**
  - files: `src/lib/storage/*`, `src/app/api/v1/epreuves/copies/[copieId]/file/route.ts`, `src/app/api/v1/ressources/file/route.ts`, `src/app/api/v1/media/[id]/route.ts`
  - action: verify uniform access control, path validation, prod storage assumptions
  - impact: fewer file access regressions

## P2

### Cleanup / simplification / non-critical refactors

- **Auth/security layer simplification**
  - only after proving actual runtime ownership between `middleware.ts` and `proxy.ts`
- **Repository / fallback cleanup**
  - remove dead or purely historical fallback helpers only after proving they are unused in prod paths
- **Module boundary cleanup**
  - reduce coupling between billing, memory, oral, and notification side effects where tests permit
- **Prompt / MCP / agent-side cleanup**
  - only after preserving existing MCP scope and tool contracts
- **Doc pruning of stale references**
  - only after code truth is stable

## Quick wins

- verify all critical commands in docs against `package.json`
- verify all teacher routes use the same scope assumptions
- verify payment routes share consistent status/error mapping
- verify `scripts/check-env.js` covers all actually mandatory prod vars
- verify `proxy.ts` and `middleware.ts` are not drifting silently
- verify health endpoints reflect real dependencies rather than shallow success

## Structural refactors

These are not first-wave changes. They require proof and narrow planning.

- unify request security layering if `middleware.ts` and `proxy.ts` overlap in production
- reduce direct route-to-service coupling where handlers contain too much orchestration
- formalize a single prod-degradation policy across DB, Redis, storage, MCP, email
- consolidate duplicated access-control logic into shared audited guards

## Missing tests to add if gaps are confirmed

- teacher RBAC + class scope regressions
- payment callback replay / idempotency / invalid source cases
- Redis unavailable in production for quotaed actions
- worker unavailable in production for correction submission
- cron route auth and duplicate execution prevention
- storage provider behavior in production-like env
- middleware/proxy auth behavior matrix for page vs API vs public endpoints
- MCP client failures and internal health contract

## Guardrails to add if audit confirms the need

- config-contract tests for prod env assumptions
- route-level regression tests for teacher data scope
- callback signature/source validation tests
- queue liveness or startup sanity checks
- explicit non-regression tests around hardened prod behavior
- CI job that runs the most critical contract subset on every protected branch

## Dependencies between lots

- auth gate review before RBAC simplification
- payment flow verification before billing cleanup
- queue/worker verification before any async refactor
- persistence fallback audit before repo cleanup
- storage contract verification before file-serving cleanup
- docs cleanup only after code and runtime behavior are confirmed
