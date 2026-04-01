# Lot 4 Remaining Tasks Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the remaining Lot 4 work by streaming atelier-écrit corrections, hardening the CSRF/client experience, and locking down the security surface (nonce-based CSP, uniform AbortSignal timeout, nonce-aware PDF generation).

**Architecture:** We extend the correcteur route to stream Mistral responses via a ReadableStream while keeping a non-streaming fallback, refactor the CSRF client to poll for tokens and fetch from `/api/v1/csrf` if missing, and introduce nonce propagation via middleware so both HTTP headers and PDF generation consistently use the same nonce.

**Tech Stack:** Next.js App Router (middleware + route APIs), TypeScript strict with Vitest for unit tests and Playwright for the freemium E2E flow, AbortSignal/streaming Fetch APIs, and pino logger + PDF generator.

---

## Chunk 1: Atelier écrit streaming endpoint

**Files:**
- Modify `src/app/api/v1/correcteur/route.ts` to detect `Accept: text/event-stream` or `Accept: application/json` and return a streaming body when requested.
- Create helper `src/lib/correcteur/streaming.ts` to wrap the Mistral client, pipe its chunks, and provide structured telemetry.
- Update tests: add `tests/unit/api/correcteur-streaming.test.ts` covering streaming vs fallback, and `tests/e2e/atelier-ecrit-freemium.spec.ts` for the freemium flow.

- [ ] **Step 1: Write failing unit test** in `tests/unit/api/correcteur-streaming.test.ts` asserting that when the route sees `Accept: text/event-stream` it returns a `ReadableStream` and `maxDuration` guard is respected.
  Run: `npm run test:unit tests/unit/api/correcteur-streaming.test.ts`
  Expect: FAIL because streaming logic does not yet exist.
- [ ] **Step 2: Implement streaming logic** in `src/app/api/v1/correcteur/route.ts` calling new helper; guard `maxDuration = 120` and ensure we stream tokens to the response body.
- [ ] **Step 3: Run unit test** same command; expect PASS.
- [ ] **Step 4: Add E2E freemium test** `tests/e2e/atelier-ecrit-freemium.spec.ts` verifying subject generation succeeds then OCR upload yields quota error.
  Run: `npx playwright test tests/e2e/atelier-ecrit-freemium.spec.ts`
  Expect: PASS once streaming endpoint sitting behind same route works.
- [ ] **Step 5: Commit** with `git commit -m "fix(api): add streaming correcteur endpoint"`

## Chunk 2: Async CSRF token support

**Files:**
- Modify `src/lib/security/csrf-client.ts` (or equivalent) to export `getCsrfToken` Promise + `useCsrfToken` hook.
- Update `src/app/atelier-ecrit/hooks` or consumers to rely on `getCsrfToken` before submitting blobs.
- Add `tests/unit/security/csrf-client.test.ts` verifying polling logic and fallback fetch when token missing.

- [ ] **Step 1: Write failing test** in `tests/unit/security/csrf-client.test.ts` asserting `getCsrfToken` resolves by polling `document.querySelector('meta[name="csrf-token"]')` or fetching `/api/v1/csrf` when missing.
- [ ] **Step 2: Implement polling/fetch logic** in `src/lib/security/csrf-client.ts` (await `document` readiness, try DOM 10x; if not found within 500ms, fetch `/api/v1/csrf`). Expose hook that caches token.
- [ ] **Step 3: Run unit test** (should pass).
- [ ] **Step 4: Update any callers (atelier écrit upload?) to await `getCsrfToken` when building requests, and ensure there’s no race where undefined token would have been used.
- [ ] **Step 5: Commit** `git commit -m "fix(security): async csrf token helper"`

## Chunk 3: Security hardening (CSP nonce + AbortSignal + PDF nonce)

**Files:**
- Modify `middleware.ts` to generate a `crypto.randomUUID()` nonce per request, add it to CSP header, expose it via `request.headers.set('x-csp-nonce', nonce)` for use in route handlers, and store it in the `response.headers` so PDFs can read it.
- Update `src/lib/llm/orchestrator.ts` (or whichever Mistral adapter) to wrap fetch calls with `AbortSignal.timeout(parseInt(process.env.LLM_TIMEOUT_MS ?? '30000'))` every time.
- Update `src/lib/pdf/generator.ts` to accept an optional `nonce` argument, call `safeStr`, and use `Date.now()-randomUUID` combination for S3 key + include nonce where relevant.
- Add `tests/unit/security/csp-nonce.test.ts` verifying middleware injects nonce-consistent header and `tests/unit/pdf/generator.test.ts` verifying escape+nonce usage.

- [ ] **Step 1: Write failing tests** for nonce propagation and `AbortSignal` usage (mocks), plus PDF escaping.
- [ ] **Step 2: Implement middleware nonce + CSP header adjustments and ensure PDF generator and streaming helpers use the nonce.
- [ ] **Step 3: Ensure `LLM_TIMEOUT_MS` is used on every fetch in `llm/orchestrator.ts`. Run targeted tests if available.
- [ ] **Step 4: Run entire unit suite** `npm run test:unit` verifying new tests pass.
- [ ] **Step 5: Commit** `git commit -m "fix(security): nonce CSP and timeout hardening"`

---

Plan complete and saved to `docs/superpowers/plans/2026-04-01-audit-v9-lot4-remaining.md`. Ready to execute?
