# Final Production Audit Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-run the full pre-commercial production audit against the live Nexus Réussite EAF system, fix reproducible defects, redeploy them, and finish with an evidence-backed release decision.

**Architecture:** The audit runs sequentially in production-facing blocks so each finding can be reproduced, documented, fixed, redeployed, and revalidated before later evidence depends on stale state. Each phase updates its dedicated report file in `docs/CLAUDE_FINAL_PROD_AUDIT/`, and any code fix flows through local verification, commit, push, deployment, and production retest. Critical or release-blocking defects stop downstream work until resolved or explicitly qualified.

**Tech Stack:** Bash, SSH, curl, Next.js 16, React 19, TypeScript, Prisma 6, PostgreSQL, Redis, PM2, Nginx, Vitest, Playwright

---

## Chunk 1: Prepare Audit Workspace and Phase Documents

### Task 1: Normalize audit artifact targets

**Files:**
- Modify: `docs/CLAUDE_FINAL_PROD_AUDIT/00_SOURCE_OF_TRUTH.md`
- Modify: `docs/CLAUDE_FINAL_PROD_AUDIT/01_SURFACE_MAP.md`
- Modify: `docs/CLAUDE_FINAL_PROD_AUDIT/02_PUBLIC_ANONYMOUS_FLOWS.md`
- Modify: `docs/CLAUDE_FINAL_PROD_AUDIT/03_AUTH_REGISTRATION_EMAILS.md`
- Modify: `docs/CLAUDE_FINAL_PROD_AUDIT/04_STUDENT_DASHBOARD_AND_FLOWS.md`
- Modify: `docs/CLAUDE_FINAL_PROD_AUDIT/05_STUDENT_WORKSHOPS_END_TO_END.md`
- Modify: `docs/CLAUDE_FINAL_PROD_AUDIT/06_LIBRARY_AND_MEDIA.md`
- Modify: `docs/CLAUDE_FINAL_PROD_AUDIT/07_BILLING_AND_MANUAL_ACTIVATION.md`
- Modify: `docs/CLAUDE_FINAL_PROD_AUDIT/08_ROLES_PARENT_TEACHER_ADMIN.md`
- Modify: `docs/CLAUDE_FINAL_PROD_AUDIT/09_AI_RAG_LLM_MCP_MEMORY.md`
- Modify: `docs/CLAUDE_FINAL_PROD_AUDIT/10_FRONT_BACK_DB_CONSISTENCY.md`
- Modify: `docs/CLAUDE_FINAL_PROD_AUDIT/11_SECURITY_AND_HARDENING.md`
- Modify: `docs/CLAUDE_FINAL_PROD_AUDIT/12_TESTS_AND_CI.md`
- Modify: `docs/CLAUDE_FINAL_PROD_AUDIT/13_UX_COPY_AND_COMMERCIAL_READINESS.md`
- Modify: `docs/CLAUDE_FINAL_PROD_AUDIT/99_FINAL_RELEASE_DECISION.md`

- [ ] **Step 1: Inspect existing audit document names and gaps**

Run: `rg --files docs/CLAUDE_FINAL_PROD_AUDIT`
Expected: confirm existing files, mismatched names, and missing canonical filenames.

- [ ] **Step 2: Rewrite or replace phase files with canonical structure**

For each phase file, ensure sections exist for:
- scope,
- commands executed,
- observations,
- defects found,
- fixes applied,
- production retest evidence,
- residual risks.

- [ ] **Step 3: Record audit metadata template**

Each phase file should start with:
- date/time,
- local SHA,
- origin SHA,
- production SHA when known,
- accounts or test data used,
- blocker status.

- [ ] **Step 4: Verify document tree is ready**

Run: `rg -n "^#|^##" docs/CLAUDE_FINAL_PROD_AUDIT`
Expected: every phase document has a structured heading layout.

## Chunk 2: Phase 0 and Phase 1

### Task 2: Establish source of truth

**Files:**
- Modify: `docs/CLAUDE_FINAL_PROD_AUDIT/00_SOURCE_OF_TRUTH.md`
- Inspect: `ecosystem.config.cjs`
- Inspect: `scripts/deploy.sh`
- Inspect: `scripts/nginx-eaf.conf`
- Inspect: `prisma/schema.prisma`
- Inspect: `packages/mcp-server/package.json`

- [ ] **Step 1: Capture SHA triad**

Run:
- `git rev-parse HEAD`
- `git rev-parse origin/main`
- `curl -s https://eaf.nexusreussite.academy/api/v1/health`

Expected: capture local, origin, and production release identifiers and note any mismatch immediately.

- [ ] **Step 2: Inspect live infrastructure**

Run:
- `ssh root@88.99.254.59 'pm2 list'`
- `ssh root@88.99.254.59 'pm2 show eaf-nextjs || pm2 show 0'`
- `ssh root@88.99.254.59 'nginx -t'`
- `ssh root@88.99.254.59 'nginx -T | grep -E "server_name|proxy_pass|listen|ssl|Strict-Transport-Security"'`
- `ssh root@88.99.254.59 'ss -tlnp'`

Expected: only intended services online, no public `3000/3100/5432/6379`, Nginx config valid.

- [ ] **Step 3: Inspect stateful dependencies**

Run:
- `ssh root@88.99.254.59 'redis-cli ping'`
- `ssh root@88.99.254.59 'redis-cli info memory | grep used_memory_human'`
- `npx prisma migrate status`
- `npx prisma db pull --print`

Expected: DB reachable, migrations applied, Redis alive, no pending migration surprises.

- [ ] **Step 4: Inspect suspicious configuration files**

Run:
- `sed -n '1,200p' netlify.toml`
- `sed -n '1,200p' vercel.json`
- `find .antigravity -type f | head -20`
- `sed -n '1,120p' .windsurfrules`
- `sed -n '1,240p' .env.example`

Expected: no secrets, no active alternate deployment targets with conflicting live instances.

- [ ] **Step 5: Record defects and stop if critical**

If a critical defect appears, document it, diagnose the root cause, and do not advance to Phase 1 until resolved or explicitly qualified.

### Task 3: Build the complete surface map

**Files:**
- Modify: `docs/CLAUDE_FINAL_PROD_AUDIT/01_SURFACE_MAP.md`
- Inspect: `src/app/**/page.tsx`
- Inspect: `src/app/api/**/route.ts`
- Inspect: `prisma/schema.prisma`
- Inspect: `ecosystem.config.cjs`
- Inspect: `.github/workflows/*.yml`

- [ ] **Step 1: Enumerate pages**

Run: `find src/app -name "page.tsx" -not -path "*/api/*" | sort`
Expected: complete public and protected route inventory.

- [ ] **Step 2: Enumerate APIs**

Run: `find src/app/api -name "route.ts" | sort`
Expected: full API inventory grouped by auth, student, parent, teacher, admin, AI, billing, and monitoring.

- [ ] **Step 3: Enumerate Prisma models and plans**

Run:
- `grep '^model ' prisma/schema.prisma`
- `grep -rn "FREEMIUM\\|FREE\\|PREMIUM\\|MASTERIUM\\|PRO\\|MAX\\|MONTHLY\\|LIFETIME" src --include='*.ts' --include='*.tsx'`

Expected: list of business-critical models and plan label leaks.

- [ ] **Step 4: Inspect operational scripts and workflows**

Run:
- `ls scripts`
- `ls .github/workflows`
- `sed -n '1,220p' .github/workflows/*.yml`

Expected: complete inventory of deploy, CI, resource indexing, and operational scripts.

## Chunk 3: Phase 2 and Phase 3

### Task 4: Audit public anonymous flows

**Files:**
- Modify: `docs/CLAUDE_FINAL_PROD_AUDIT/02_PUBLIC_ANONYMOUS_FLOWS.md`
- Inspect: `src/app/page.tsx`
- Inspect: `src/app/pricing/page.tsx`
- Inspect: `next.config.ts`
- Inspect: `middleware.ts`
- Test: `tests/audit/phase2-public.spec.ts`

- [ ] **Step 1: Measure public HTTP status and headers**

Run the prescribed `curl` matrix for `/`, `/login`, `/pricing`, legal pages, `robots.txt`, `sitemap.xml`, `favicon.ico`, and `/api/v1/health`.
Expected: no `500`, correct redirects, and security headers present.

- [ ] **Step 2: Validate landing page content and SEO**

Run:
- `curl -s https://eaf.nexusreussite.academy/`
- Playwright on public pages if needed

Expected: only `Freemium`, `Premium`, `Masterium`; no legacy payment/provider labels; expected hero, CTA, footer, metadata, and canonical content.

- [ ] **Step 3: Validate robots, sitemap, and leakage checks**

Run the prescribed `grep` checks against page HTML, `robots.txt`, and `sitemap.xml`.
Expected: no technical label leaks, `/admin/*` and `/api/*` disallowed where expected.

- [ ] **Step 4: Run public visual/regression checks if needed**

Run: `npx playwright test --config=tests/audit/playwright.audit.config.ts tests/audit/phase2-public.spec.ts`
Expected: reproduce any UI-only issue with screenshots or test logs.

### Task 5: Audit authentication, registration, and emails

**Files:**
- Modify: `docs/CLAUDE_FINAL_PROD_AUDIT/03_AUTH_REGISTRATION_EMAILS.md`
- Inspect: `src/app/login/**`
- Inspect: `src/app/api/v1/auth/**`
- Inspect: `emails/*.tsx`
- Test: `tests/e2e/inscription-workflow.spec.ts`
- Test: `tests/e2e/login-role-routing.spec.ts`
- Test: `tests/integration/api/auth.test.ts`

- [ ] **Step 1: Create audit accounts**

Generate timestamped emails for student, parent, teacher, and if needed admin test flows.
Expected: every created identity is traceable in the report.

- [ ] **Step 2: Exercise registration and login flows**

Use Playwright and API checks to validate redirect behavior, created profiles, default plan, and role-based landing pages.

- [ ] **Step 3: Exercise forgot-password and rate limits**

Run the prescribed `curl` loops for login and reset.
Expected: generic errors for nonexistent emails, `429` after threshold, reset tokens invalidated after use.

- [ ] **Step 4: Validate email evidence**

Run server log checks over SSH and inspect generated links/content.
Expected: real `messageId`, production URLs, no placeholders, coherent sender identity.

- [ ] **Step 5: Stop and fix if auth or email blockers appear**

If signup, login, reset, session invalidation, or email proof fails, diagnose before continuing.

## Chunk 4: Phases 4, 5, and 6

### Task 6: Audit student dashboard, onboarding, quotas, and gamification

**Files:**
- Modify: `docs/CLAUDE_FINAL_PROD_AUDIT/04_STUDENT_DASHBOARD_AND_FLOWS.md`
- Inspect: `src/app/dashboard/**`
- Inspect: `src/app/onboarding/**`
- Inspect: `src/app/profil/**`
- Inspect: `src/app/mon-parcours/**`
- Test: `tests/e2e/onboarding.spec.ts`
- Test: `tests/e2e/parcours.spec.ts`
- Test: `tests/e2e/platform.spec.ts`

- [ ] **Step 1: Prepare Freemium, Premium, and Masterium accounts**

Create or upgrade dedicated audit users via activation codes as needed.
Expected: three isolated states with traceable subscriptions.

- [ ] **Step 2: Validate dashboard components and empty states**

Use browser testing plus API/DB checks for countdown, streak, badges, mapping, recommendations, theme, dyslexia mode, and logout.

- [ ] **Step 3: Validate onboarding and profile persistence**

Complete each onboarding step and verify data persistence in DB or API responses.

- [ ] **Step 4: Validate quotas and paywalls**

Attempt over-quota actions for oral, written, tutor, and locked content.
Expected: clear user-facing paywalls, no partial premium leakage, no URL bypass.

- [ ] **Step 5: Validate gamification and memory side effects**

Inspect DB-backed events where available and verify dashboard recommendations change with activity.

### Task 7: Audit student workshops end to end

**Files:**
- Modify: `docs/CLAUDE_FINAL_PROD_AUDIT/05_STUDENT_WORKSHOPS_END_TO_END.md`
- Inspect: `src/app/ateliers/**`
- Inspect: `src/app/api/v1/oral/**`
- Inspect: `src/app/api/v1/ecrit/**`
- Inspect: `src/app/api/v1/copies/**`
- Inspect: `src/app/api/v1/langue/**`
- Inspect: `src/app/api/v1/quiz/**`
- Inspect: `src/app/api/v1/tuteur/**`
- Inspect: `src/app/api/v1/carnet/**`
- Inspect: `src/app/api/v1/descriptif/**`
- Test: `tests/e2e/atelier-oral.spec.ts`
- Test: `tests/e2e/atelier-ecrit.spec.ts`
- Test: `tests/e2e/tuteur-chat.spec.ts`
- Test: `tests/e2e/descriptif-carnet.spec.ts`
- Test: `tests/e2e/quiz-adaptatif.spec.ts`

- [ ] **Step 1: Audit oral session lifecycle**

Start a session, complete phases, fetch the bilan, and inspect persistence.
Expected: correct scoring structure, no duplicate session on double-click, coherent incomplete-session behavior.

- [ ] **Step 2: Audit written workflow**

Generate a subject, upload accepted/rejected files, wait for correction, and validate report contents.

- [ ] **Step 3: Audit language, quiz, and tutor**

Exercise targeted generation, correction, adaptive difficulty, anti-cheat guidance, and quota enforcement.

- [ ] **Step 4: Audit carnet and descriptif**

Create, list, update, and delete notes; create descriptif content and validate reuse by oral flows.

- [ ] **Step 5: Audit activation redeem path from student side**

Redeem valid, invalid, expired, used, and duplicated codes and verify DB/UI consistency.

### Task 8: Audit library, resources, and media streaming

**Files:**
- Modify: `docs/CLAUDE_FINAL_PROD_AUDIT/06_LIBRARY_AND_MEDIA.md`
- Inspect: `src/app/bibliotheque/**`
- Inspect: `src/app/api/v1/resources/**`
- Inspect: `src/app/api/v1/media/**`
- Inspect: `scripts/scan-ressources.ts`
- Test: `tests/unit/api/media-route.test.ts`

- [ ] **Step 1: Measure catalog inventory**

Run the catalog API and local resource scan.
Expected: inventory size and category distribution are coherent.

- [ ] **Step 2: Validate plan-based access control**

Test free, premium, and masterium resource access through UI and direct API calls.
Expected: premium resources return `403` to free users and remain locked in UI.

- [ ] **Step 3: Run resource security probes**

Test path traversal, null byte, and direct static URL access.
Expected: no file-system leakage, no unauthenticated paid-resource access.

- [ ] **Step 4: Validate media streaming semantics**

Use `curl -I` and `Range` requests.
Expected: partial content support, correct content type, no forced full download.

## Chunk 5: Phases 7, 8, and 10

### Task 9: Audit billing, activation codes, and manual payment messaging

**Files:**
- Modify: `docs/CLAUDE_FINAL_PROD_AUDIT/07_BILLING_AND_MANUAL_ACTIVATION.md`
- Inspect: `src/app/(authenticated)/**/billing*`
- Inspect: `src/app/api/v1/activation/**`
- Inspect: `src/app/api/v1/billing/**`
- Inspect: `src/app/admin/**`
- Test: `tests/e2e/payment-flow.spec.ts`
- Test: `tests/unit/api/billing-routes.test.ts`

- [ ] **Step 1: Search for plan/payment label leaks**

Run the prescribed `grep` checks for legacy payment providers and plan labels.
Expected: user-visible labels restricted to Freemium, Premium, and Masterium.

- [ ] **Step 2: Exercise admin code generation and student redeem**

Generate activation codes in admin, redeem them as students, and verify DB/UI updates.

- [ ] **Step 3: Exercise error cases and race conditions**

Test invalid, expired, used, revoked, and simultaneous redemption.
Expected: one success at most, no technical leak in errors.

- [ ] **Step 4: Validate payment messaging**

Inspect pricing and billing UI.
Expected: manual payment instructions clear, no fake card-payment affordances.

### Task 10: Audit parent, teacher, admin, and RBAC

**Files:**
- Modify: `docs/CLAUDE_FINAL_PROD_AUDIT/08_ROLES_PARENT_TEACHER_ADMIN.md`
- Inspect: `src/app/parent/**`
- Inspect: `src/app/enseignant/**`
- Inspect: `src/app/admin/**`
- Inspect: `src/app/api/v1/teacher/**`
- Inspect: `src/app/api/v1/admin/**`
- Test: `tests/e2e/admin.spec.ts`
- Test: `tests/e2e/espace-enseignant.spec.ts`
- Test: `tests/contracts/run-schemathesis-teacher-rbac.sh`
- Test: `tests/contracts/run-teacher-comment-rbac.sh`
- Test: `tests/contracts/run-teacher-export-rbac.sh`

- [ ] **Step 1: Audit parent surface**

Measure what a linked and unlinked parent can see.
Expected: commercially acceptable placeholder or usable feature, no data leak.

- [ ] **Step 2: Audit teacher surface**

Create teacher test data, class links, exports, comments, and student scoping.

- [ ] **Step 3: Audit admin surface**

Validate stats, codes, payments, users, destructive confirmations, and JS robustness.

- [ ] **Step 4: Execute RBAC matrix**

Use live sessions or tokens to test route/API access for student, parent, teacher, and admin roles.
Expected: strict authorization according to the matrix, never `200` for forbidden surfaces.

### Task 11: Audit front/API/DB consistency

**Files:**
- Modify: `docs/CLAUDE_FINAL_PROD_AUDIT/10_FRONT_BACK_DB_CONSISTENCY.md`
- Inspect: `src/app/api/v1/me/**`
- Inspect: `src/app/api/v1/dashboard/**`
- Inspect: `src/app/api/v1/oral/**`
- Inspect: `src/app/api/v1/resources/**`
- Inspect: `src/app/api/v1/carnet/**`

- [ ] **Step 1: Define consistency probes**

For plan badge, scores, usage counters, oral bilan, activation redeem, streak, resource locks, carnet entries, and teacher student lists, note the exact UI/API/DB chain to compare.

- [ ] **Step 2: Run each chain comparison**

Capture UI observation, API response, and DB evidence for each priority flow.

- [ ] **Step 3: Document every divergence**

Any mismatch becomes a defect with reproduction, suspected cause, and severity.

## Chunk 6: Phases 9, 11, 12, 13, and 14

### Task 12: Audit AI, RAG, MCP, and memory

**Files:**
- Modify: `docs/CLAUDE_FINAL_PROD_AUDIT/09_AI_RAG_LLM_MCP_MEMORY.md`
- Inspect: `packages/mcp-server/package.json`
- Inspect: `packages/mcp-server/src/**`
- Inspect: `src/app/api/v1/health/route.ts`
- Test: `packages/mcp-server/tests/*.test.ts`
- Test: `tests/integration/rag*.test.ts`

- [ ] **Step 1: Measure AI health surface**

Call `/api/v1/health` and record `rag`, `mcp`, `llm`, and release metadata.

- [ ] **Step 2: Inspect MCP and tool exposure**

Inventory MCP tools and verify whether live tutor behavior appears grounded in MCP/RAG outputs.

- [ ] **Step 3: Probe citation quality and embedding presence**

Ask corpus-specific questions and verify source plausibility against available corpus/index data.

- [ ] **Step 4: Probe provider fallback if feasible**

If a safe non-production-disruptive method exists, verify graceful fallback behavior; otherwise record this as an unverified release risk.

### Task 13: Audit security and hardening

**Files:**
- Modify: `docs/CLAUDE_FINAL_PROD_AUDIT/11_SECURITY_AND_HARDENING.md`
- Inspect: `next.config.ts`
- Inspect: `middleware.ts`
- Inspect: `scripts/nginx-eaf.conf`
- Inspect: `netlify.toml`
- Inspect: `vercel.json`
- Inspect: `.windsurfrules`
- Inspect: `.antigravity/**`
- Test: `tests/e2e/securite.spec.ts`
- Test: `tests/unit/api/csrf-route.test.ts`

- [ ] **Step 1: Re-check headers, cookies, and CSRF**

Run the prescribed `curl` checks for HSTS, CSP, cookie flags, and missing-CSRF mutations.

- [ ] **Step 2: Probe sensitive direct file access**

Request `.env`, `.git/config`, and Prisma schema paths through production.
Expected: all blocked.

- [ ] **Step 3: Probe alternate deployment surfaces**

Query Netlify/Vercel targets and determine if they are active.
Expected: no live parallel prod instance.

- [ ] **Step 4: Probe secret leakage in repo files**

Search `.antigravity`, `.windsurfrules`, workflow files, and config files for exposed secrets.

- [ ] **Step 5: Re-check exposed ports and API rate limits**

Use SSH and live API probes to confirm no forbidden public exposure and that `429` includes `Retry-After`.

### Task 14: Run technical tests and CI verification

**Files:**
- Modify: `docs/CLAUDE_FINAL_PROD_AUDIT/12_TESTS_AND_CI.md`
- Inspect: `package.json`
- Inspect: `.github/workflows/*.yml`
- Test: `npm run typecheck`
- Test: `npm run lint`
- Test: `npm run test:unit`
- Test: `npm run test:e2e`
- Test: `npx knip`
- Test: `npm audit --audit-level=high`
- Test: `npm run ci:fr-copy`

- [ ] **Step 1: Run compilation and lint checks**

Expected: no TypeScript errors, no blocking lint errors.

- [ ] **Step 2: Run unit and E2E suites**

Expected: capture actual counts, failures, skips, and timing; no unsupported success claims.

- [ ] **Step 3: Run dead-code, audit, and copy checks**

Expected: identify unused files/exports, high/critical vulnerabilities, and French copy regressions.

- [ ] **Step 4: Check latest GitHub Actions status**

Query recent workflow runs and record latest relevant CI conclusion.

### Task 15: Audit UX, wording, and release decision

**Files:**
- Modify: `docs/CLAUDE_FINAL_PROD_AUDIT/13_UX_COPY_AND_COMMERCIAL_READINESS.md`
- Modify: `docs/CLAUDE_FINAL_PROD_AUDIT/99_FINAL_RELEASE_DECISION.md`
- Inspect: `src/app/**`
- Inspect: `src/components/**`

- [ ] **Step 1: Review user-facing copy and empty states**

Capture leaked technical messages, `null/undefined` states, unclear parent/teacher wording, and mobile UX failures.

- [ ] **Step 2: Consolidate all open and fixed defects**

Ensure each defect has severity, reproduction, root cause, impact, and proof status.

- [ ] **Step 3: Write final decision document**

Use the mandated structure for source of truth, tested perimeter, defects found, defects fixed with commits, remaining defects, evidence, and final state `GO TOTAL`, `GO AVEC RÉSERVES`, or `NO GO`.

- [ ] **Step 4: Verify evidence before closure**

Before claiming completion, confirm every cited fix has production retest evidence and every unverified area is explicitly called out.
