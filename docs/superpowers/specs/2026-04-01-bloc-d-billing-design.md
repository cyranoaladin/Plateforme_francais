# Bloc D Billing Design

## Scope

This design covers only Bloc D from the Nexus Réussite EAF audit:
- D1 Atomic Redis quota enforcement
- D2 Unlimited-plan Redis circuit breaker
- D3 Shared billing catalog for the MCP server
- D4 Official 2025-2026 programme alignment in the MCP server

It explicitly excludes oral UI, written workshop streaming, CI/CD, PDF, and CSP work.

## Goals

- Make quota enforcement atomic under concurrent load.
- Avoid Redis dependency for unlimited plans.
- Remove billing-plan duplication between the Next.js app and the MCP server.
- Make the MCP programme tool derive its works catalog from a shared source of truth.

## Non-goals

- Rewriting all billing APIs.
- Changing Prisma schema or introducing new database tables.
- Renaming public MCP tool contracts.
- Changing user-facing pricing copy beyond what existing catalog data already defines.

## Constraints

- Existing public signatures for `checkQuota` and `consumeQuota` should remain stable.
- Existing tests must keep passing, with new coverage for corrected behavior.
- The app and `packages/mcp-server` must both compile through workspace imports.
- French strings should remain coherent with the current baseline; Bloc D should not introduce avoidable copy drift.

## Architecture

### Shared source of truth

Create a new workspace package `packages/shared-billing/` that owns:
- billing types (`PlanId`, `EntitlementKey`, `QuotaEntry`, etc.)
- `PLAN_CATALOG` and plan-label helpers
- programme data used by the MCP server

The Next.js app and `packages/mcp-server` will import from this package. To reduce blast radius in the app, `src/lib/billing/plan-catalog.ts` becomes a local compatibility re-export.

### Quota runtime

`src/lib/billing/usage.ts` remains the runtime integration layer because it depends on the app Redis client and app logger.

Its internal quota path becomes:
1. resolve quota entry
2. fast-return for unlimited quotas without touching Redis
3. use one Lua `EVAL` script for atomic check-and-consume semantics
4. preserve fail-open behavior in dev and fail-closed behavior in production for numeric quotas

`checkQuota(..., amount=0)` remains a read-style call implemented through the same Lua script with zero cost, so behavior stays consistent with `consumeQuota`.

### MCP alignment

`packages/mcp-server/src/tools/all-tools.ts` will stop importing billing data from the app `src/` tree and import from `shared-billing` instead.

The `getProgramme2026` tool will be corrected to return the official 2025-2026 set required by the audit prompt:
- Poésie: Rimbaud, Ponge, Dorion
- Littérature d'idées: La Boétie, Fontenelle, Graffigny
- Théâtre: Corneille, Musset, Sarraute
- Roman: Prévost, Balzac, Colette

The shared programme module will expose structured data and the MCP tool will derive its output from that data rather than hardcoded literals.

## File boundaries

### New files

- `packages/shared-billing/package.json`
- `packages/shared-billing/tsconfig.json`
- `packages/shared-billing/src/index.ts`
- `packages/shared-billing/src/plan-catalog.ts`
- `packages/shared-billing/src/programme-oeuvres.ts`

### Modified files

- `src/lib/billing/plan-catalog.ts`
- `src/lib/billing/usage.ts`
- `packages/mcp-server/src/tools/all-tools.ts`
- `packages/mcp-server/tests/plan-catalog.test.ts`
- `tests/unit/billing/quota-atomicity.test.ts`
- `tests/unit/billing/quotas-single-source.test.ts`
- `tests/unit/billing/fallback-prod.test.ts`

### Optional test additions

- `packages/mcp-server/tests/all-tools.test.ts`
- `packages/shared-billing/tests/plan-catalog.test.ts`

## Error handling

- Unlimited plans: always allow immediately, do not call Redis.
- Numeric quotas with Redis unavailable in development: allow and log warning.
- Numeric quotas with Redis unavailable in production: deny through the existing fail-closed path.
- Atomic refusal must return the existing `QuotaExceededError` semantics to avoid breaking callers.

## Testing strategy

- Unit test atomic concurrency: two simultaneous consumes against limit `1`, exactly one succeeds.
- Unit test unlimited plans never call Redis.
- Regression test shared plan limits remain aligned across app and MCP.
- MCP test verifies the 12 required official works are present.

## Risks and mitigations

### Workspace resolution drift

Risk: the root app and MCP server may resolve the new shared package differently.

Mitigation: create a proper workspace package with its own `package.json` and keep the app-side compatibility re-export.

### Mock contract drift in billing tests

Risk: tests may assume the older two-step quota semantics.

Mitigation: keep public return shapes stable and update only the internal execution path.

### Programme naming mismatch

Risk: the MCP function name `getProgramme2026` suggests a 2026 set while the audit requires the official 2025-2026 programme.

Mitigation: keep the function name stable for compatibility, but derive its payload from the shared official 2025-2026 dataset and document that expectation in tests.
