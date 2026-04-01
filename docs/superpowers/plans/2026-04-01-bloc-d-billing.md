# Bloc D Billing Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make quota enforcement atomic, bypass Redis for unlimited plans, and move billing/programme source-of-truth into a shared workspace package used by both the app and MCP server.

**Architecture:** Introduce `packages/shared-billing/` as the canonical home for billing types, plan catalog, and official programme data. Keep quota runtime in the app, but refactor it to a single Lua-backed atomic path while preserving current external APIs.

**Tech Stack:** TypeScript, Next.js App Router, Vitest, npm workspaces, Redis Lua scripts, MCP server.

---

## Chunk 1: Shared package extraction

### Task 1: Scaffold the shared workspace package

**Files:**
- Create: `packages/shared-billing/package.json`
- Create: `packages/shared-billing/tsconfig.json`
- Create: `packages/shared-billing/src/index.ts`

- [ ] **Step 1: Write the failing package wiring check**

Add or update an existing test import path so the workspace package is referenced from a test target.

- [ ] **Step 2: Run the targeted test to verify package resolution currently fails**

Run: `npm run test:unit -- tests/unit/billing/quotas-single-source.test.ts`

- [ ] **Step 3: Add the minimal workspace package metadata**

Create a package exposing `./src/index.ts` and a simple TypeScript config compatible with the repo workspace layout.

- [ ] **Step 4: Re-run the targeted test to verify resolution reaches the package**

Run: `npm run test:unit -- tests/unit/billing/quotas-single-source.test.ts`

- [ ] **Step 5: Commit**

```bash
git add packages/shared-billing
git commit -m "feat(billing): scaffold shared workspace package"
```

### Task 2: Move shared billing catalog primitives

**Files:**
- Create: `packages/shared-billing/src/plan-catalog.ts`
- Modify: `packages/shared-billing/src/index.ts`
- Modify: `src/lib/billing/plan-catalog.ts`
- Test: `tests/unit/billing/quotas-single-source.test.ts`

- [ ] **Step 1: Extend the failing SSOT test to assert imports come from the shared package**

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `npm run test:unit -- tests/unit/billing/quotas-single-source.test.ts`

- [ ] **Step 3: Move catalog types and helpers into the shared package**

Keep app compatibility by turning `src/lib/billing/plan-catalog.ts` into a re-export surface.

- [ ] **Step 4: Re-run the targeted test to verify it passes**

Run: `npm run test:unit -- tests/unit/billing/quotas-single-source.test.ts`

- [ ] **Step 5: Commit**

```bash
git add packages/shared-billing/src src/lib/billing/plan-catalog.ts tests/unit/billing/quotas-single-source.test.ts
git commit -m "feat(billing): share plan catalog across workspaces"
```

## Chunk 2: Atomic quotas

### Task 3: Lock the atomic concurrency behavior with tests

**Files:**
- Modify: `tests/unit/billing/quota-atomicity.test.ts`
- Modify: `tests/unit/billing/fallback-prod.test.ts`
- Test: `tests/unit/billing/quota-atomicity.test.ts`
- Test: `tests/unit/billing/fallback-prod.test.ts`

- [ ] **Step 1: Write the failing concurrency and unlimited-plan tests**

Cover:
- exactly one success under two simultaneous consumes with limit `1`
- unlimited quotas do not call Redis in production

- [ ] **Step 2: Run the targeted tests to verify they fail**

Run: `npm run test:unit -- tests/unit/billing/quota-atomicity.test.ts tests/unit/billing/fallback-prod.test.ts`

- [ ] **Step 3: Commit the failing tests**

```bash
git add tests/unit/billing/quota-atomicity.test.ts tests/unit/billing/fallback-prod.test.ts
git commit -m "test(billing): cover atomic quota and unlimited bypass"
```

### Task 4: Refactor quota runtime to one atomic path

**Files:**
- Modify: `src/lib/billing/usage.ts`
- Test: `tests/unit/billing/quota-atomicity.test.ts`
- Test: `tests/unit/billing/fallback-prod.test.ts`

- [ ] **Step 1: Implement the minimal Lua-backed atomic runtime**

Preserve `checkQuota`, `consumeQuota`, and `rollbackQuota` external behavior.

- [ ] **Step 2: Run targeted billing tests**

Run: `npm run test:unit -- tests/unit/billing/quota-atomicity.test.ts tests/unit/billing/fallback-prod.test.ts tests/unit/billing/quotas.test.ts`

- [ ] **Step 3: Commit**

```bash
git add src/lib/billing/usage.ts tests/unit/billing/quota-atomicity.test.ts tests/unit/billing/fallback-prod.test.ts
git commit -m "fix(billing): enforce quotas atomically"
```

## Chunk 3: MCP synchronization

### Task 5: Add the shared programme catalog

**Files:**
- Create: `packages/shared-billing/src/programme-oeuvres.ts`
- Modify: `packages/shared-billing/src/index.ts`
- Test: `packages/mcp-server/tests/all-tools.test.ts`

- [ ] **Step 1: Write the failing MCP programme test**

Assert the 12 official works are exposed through the MCP path.

- [ ] **Step 2: Run the MCP targeted test to verify it fails**

Run: `npm run mcp:test -- --run packages/mcp-server/tests/all-tools.test.ts`

- [ ] **Step 3: Implement the shared programme dataset**

- [ ] **Step 4: Re-run the targeted MCP test to verify it passes**

Run: `npm run mcp:test -- --run packages/mcp-server/tests/all-tools.test.ts`

- [ ] **Step 5: Commit**

```bash
git add packages/shared-billing/src/programme-oeuvres.ts packages/shared-billing/src/index.ts packages/mcp-server/tests/all-tools.test.ts
git commit -m "feat(mcp): share official programme catalog"
```

### Task 6: Switch MCP server to shared billing data

**Files:**
- Modify: `packages/mcp-server/src/tools/all-tools.ts`
- Modify: `packages/mcp-server/tests/plan-catalog.test.ts`
- Modify: `packages/mcp-server/tests/all-tools.test.ts`

- [ ] **Step 1: Update failing MCP tests to encode the new SSOT expectation**

- [ ] **Step 2: Run targeted MCP tests to verify failure**

Run: `npm run mcp:test -- --run packages/mcp-server/tests/plan-catalog.test.ts packages/mcp-server/tests/all-tools.test.ts`

- [ ] **Step 3: Replace MCP-local plan/programme derivation with shared imports**

- [ ] **Step 4: Re-run targeted MCP tests**

Run: `npm run mcp:test -- --run packages/mcp-server/tests/plan-catalog.test.ts packages/mcp-server/tests/all-tools.test.ts`

- [ ] **Step 5: Commit**

```bash
git add packages/mcp-server/src/tools/all-tools.ts packages/mcp-server/tests/plan-catalog.test.ts packages/mcp-server/tests/all-tools.test.ts
git commit -m "fix(mcp): align quotas and programme with shared billing catalog"
```

## Chunk 4: Final validation

### Task 7: Run focused regression suites

**Files:**
- Test: `tests/unit/billing/quotas.test.ts`
- Test: `tests/unit/billing/quotas-single-source.test.ts`
- Test: `tests/unit/billing/quota-atomicity.test.ts`
- Test: `tests/unit/billing/fallback-prod.test.ts`
- Test: `packages/mcp-server/tests/plan-catalog.test.ts`
- Test: `packages/mcp-server/tests/all-tools.test.ts`

- [ ] **Step 1: Run the app billing tests**

Run: `npm run test:unit -- tests/unit/billing/quotas.test.ts tests/unit/billing/quotas-single-source.test.ts tests/unit/billing/quota-atomicity.test.ts tests/unit/billing/fallback-prod.test.ts`

- [ ] **Step 2: Run MCP tests**

Run: `npm run mcp:test -- --run packages/mcp-server/tests/plan-catalog.test.ts packages/mcp-server/tests/all-tools.test.ts`

- [ ] **Step 3: Fix any targeted regressions**

- [ ] **Step 4: Commit if fixes were needed**

```bash
git add -A
git commit -m "fix(billing): stabilize bloc d regressions"
```

### Task 8: Run repo-level verification

**Files:**
- Verify only

- [ ] **Step 1: Run lint**

Run: `npm run lint`
Expected: 0 errors

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: 0 errors

- [ ] **Step 3: Run the relevant app + MCP test commands**

Run: `npm run test:unit -- tests/unit/billing/quotas.test.ts tests/unit/billing/quotas-single-source.test.ts tests/unit/billing/quota-atomicity.test.ts tests/unit/billing/fallback-prod.test.ts && npm run mcp:test -- --run packages/mcp-server/tests/plan-catalog.test.ts packages/mcp-server/tests/all-tools.test.ts`

- [ ] **Step 4: Prepare PR summary**

Include:
- D1 atomicity
- D2 unlimited Redis bypass
- D3 shared package
- D4 official programme alignment
