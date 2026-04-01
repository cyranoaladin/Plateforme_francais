# Atelier Ecrit Progress Stream Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add persisted progress events plus an SSE endpoint so written-correction progress survives refreshes and updates in real time without replacing the existing async worker.

**Architecture:** Persist progress milestones in Prisma, publish them from the existing correction worker, expose a replayable SSE route per copy, and switch the correction page from blind polling to EventSource with a safe fallback.

**Tech Stack:** Next.js App Router, Prisma, PostgreSQL, Vitest, existing correction worker and repository layer.

---

## Chunk 1: Persistence Layer

### Task 1: Add Prisma model for copy progress events

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_copie_progress_events/migration.sql`
- Test: `tests/integration/db/copie-progress.test.ts`

- [ ] **Step 1: Write the failing integration test**

Create `tests/integration/db/copie-progress.test.ts` covering ordered event persistence for one `copieId`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/integration/db/copie-progress.test.ts`

- [ ] **Step 3: Add the Prisma model and SQL migration**

Add `CopieProgressEvent` with `copieId`, `stage`, `message`, `progress`, optional `payload`, and `createdAt`, plus indexes on `[copieId, createdAt]`.

- [ ] **Step 4: Implement repository helpers**

Add repository functions to create and list progress events in `src/lib/epreuves/repository.ts` or a dedicated sibling file.

- [ ] **Step 5: Run the test again**

Run: `npm run test:unit -- tests/integration/db/copie-progress.test.ts`

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations src/lib/epreuves tests/integration/db/copie-progress.test.ts
git commit -m "feat(epreuves): persist copy progress events"
```

## Chunk 2: Worker Publication

### Task 2: Publish progress events from the correction worker

**Files:**
- Modify: `src/lib/epreuves/worker.ts`
- Modify: `src/app/api/v1/epreuves/[epreuveId]/copie/route.ts`
- Test: `tests/unit/correction/worker.test.ts`

- [ ] **Step 1: Write failing worker tests**

Add assertions that the worker emits `queued`, `ocr_started`, `ocr_done`, `correction_started`, `correction_done`, `report_ready`, and `failed` in the expected branches.

- [ ] **Step 2: Run targeted worker tests**

Run: `npm run test:unit -- tests/unit/correction/worker.test.ts`

- [ ] **Step 3: Implement minimal publication**

Write `queued` on copy creation and add repository calls throughout `processCorrection`.

- [ ] **Step 4: Re-run worker tests**

Run: `npm run test:unit -- tests/unit/correction/worker.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/app/api/v1/epreuves/[epreuveId]/copie/route.ts src/lib/epreuves/worker.ts tests/unit/correction/worker.test.ts
git commit -m "feat(epreuves): publish correction progress milestones"
```

## Chunk 3: SSE Route

### Task 3: Add replayable SSE endpoint for copy progress

**Files:**
- Create: `src/app/api/v1/epreuves/copies/[copieId]/events/route.ts`
- Modify: `src/lib/epreuves/repository.ts`
- Test: `tests/unit/api/copie-events-route.test.ts`

- [ ] **Step 1: Write the failing route tests**

Cover:
- 401/403 ownership protection
- `Content-Type: text/event-stream`
- replay of existing events for a copy

- [ ] **Step 2: Run route tests and verify failure**

Run: `npm run test:unit -- tests/unit/api/copie-events-route.test.ts`

- [ ] **Step 3: Implement the SSE route**

Return persisted events first, then keep the stream open with heartbeat comments and new events.

- [ ] **Step 4: Re-run route tests**

Run: `npm run test:unit -- tests/unit/api/copie-events-route.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/app/api/v1/epreuves/copies/[copieId]/events/route.ts src/lib/epreuves/repository.ts tests/unit/api/copie-events-route.test.ts
git commit -m "feat(api): stream persisted copy progress events"
```

## Chunk 4: Frontend Integration

### Task 4: Replace polling with EventSource on the correction page

**Files:**
- Modify: `src/app/atelier-ecrit/correction/[copieId]/page.tsx`
- Test: `tests/unit/components/rapport-correction.test.tsx`
- Test: `tests/unit/components/atelier-ecrit/correction-progress-stream.test.tsx`

- [ ] **Step 1: Write failing frontend tests**

Cover:
- EventSource subscription
- history hydration into visible progress UI
- fallback to polling when EventSource is unavailable

- [ ] **Step 2: Run targeted frontend tests**

Run: `npm run test:unit -- tests/unit/components/rapport-correction.test.tsx tests/unit/components/atelier-ecrit/correction-progress-stream.test.tsx`

- [ ] **Step 3: Implement EventSource-driven progress**

Consume `/api/v1/epreuves/copies/[copieId]/events`, update visible stages, and fetch final payload when `report_ready` arrives.

- [ ] **Step 4: Re-run frontend tests**

Run: `npm run test:unit -- tests/unit/components/rapport-correction.test.tsx tests/unit/components/atelier-ecrit/correction-progress-stream.test.tsx`

- [ ] **Step 5: Commit**

```bash
git add src/app/atelier-ecrit/correction/[copieId]/page.tsx tests/unit/components/rapport-correction.test.tsx tests/unit/components/atelier-ecrit/correction-progress-stream.test.tsx
git commit -m "feat(frontend): show live written correction progress"
```

## Chunk 5: Final Verification

### Task 5: Run full verification for the feature

**Files:**
- Modify: any fixes discovered during verification

- [ ] **Step 1: Run TypeScript**

Run: `npx tsc --noEmit`

- [ ] **Step 2: Run lint**

Run: `npm run lint`

- [ ] **Step 3: Run targeted and regression tests**

Run: `npm run test:unit -- tests/unit/correction/worker.test.ts tests/unit/api/copie-events-route.test.ts tests/unit/components/rapport-correction.test.tsx tests/unit/components/atelier-ecrit/correction-progress-stream.test.tsx tests/integration/db/copie-progress.test.ts`

- [ ] **Step 4: Run build validation**

Run: `npm run build:ci`

- [ ] **Step 5: Commit verification fixes if needed**

```bash
git add .
git commit -m "fix(epreuves): finalize progress stream verification"
```
