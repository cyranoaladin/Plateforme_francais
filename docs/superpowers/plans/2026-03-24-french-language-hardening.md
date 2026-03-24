# French Language Hardening Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corriger exhaustivement les défauts de langue française dans le projet sans casser les contrats techniques, puis livrer un état production propre et vérifié.

**Architecture:** Le travail est découpé par couches de visibilité. On traite d'abord le texte visible utilisateur, ensuite les messages exposés, puis les contenus secondaires et la documentation. Chaque lot suit une boucle TDD pragmatique: mesure ciblée, correction minimale, vérification `fr-copy/tsc/lint/tests`, commit, push, déploiement si la surface touche la prod.

**Tech Stack:** Next.js 16, React 19, TypeScript, ESLint, Vitest, Playwright, tsx, scripts de contrôle FR maison

---

## Chunk 1: Baseline and Detection

### Task 1: Inventory all language-sensitive surfaces

**Files:**
- Inspect: `scripts/check-fr-copy.ts`
- Inspect: `config/fr-copy-baseline.json`
- Inspect: `src/app/**`
- Inspect: `src/components/**`
- Inspect: `src/lib/**`
- Inspect: `emails/**`

- [ ] **Step 1: Re-run the current French quality gate**

Run: `npm run ci:fr-copy`
Expected: either green or a precise list of new violations.

- [ ] **Step 2: Run targeted string searches for degraded French**

Run:
- `rg -n "ecrit|etre|oeuvre|bibliotheque|Preparation|demo|pedagog|reel|deconnect|Parametres" src/app src/components src/lib emails`
- `rg -n "[A-Za-z]'[A-Za-z]" src/app src/components emails`

Expected: a working list of user-facing strings to classify.

- [ ] **Step 3: Classify findings**

Create a working checklist grouped by:
- frontend visible
- backend exposed
- email/prompt
- internal/docs only

## Chunk 2: Marketing and Public Frontend

### Task 2: Correct landing and public pages

**Files:**
- Modify: `src/components/landing/*.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/pricing/page.tsx`
- Modify: `src/app/login/**`
- Modify: `src/app/contact/**`

- [ ] **Step 1: Write a failing focused check**

Run:
- `rg -n "ecrit|Preparation|demo|pedagog|reel" src/components/landing src/app/page.tsx src/app/pricing/page.tsx`

Expected: at least one visible degraded string is found before correction.

- [ ] **Step 2: Correct copy in place without changing IDs or routes**

Use module-level copy constants where needed. Preserve business terminology.

- [ ] **Step 3: Re-run the focused search**

Run the same `rg` command.
Expected: no remaining visible degraded strings in those files.

- [ ] **Step 4: Verify**

Run:
- `npm run ci:fr-copy`
- `npx tsc --noEmit`
- `npm run lint`

Expected: all green.

## Chunk 3: App Shells and Dashboards

### Task 3: Correct navigation and dashboard language

**Files:**
- Modify: `src/components/layout/*.tsx`
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/mon-parcours/page.tsx`
- Modify: `src/app/profil/page.tsx`
- Modify: `src/app/parent/page.tsx`
- Modify: `src/app/enseignant/page.tsx`
- Modify: `src/app/admin/page.tsx`

- [ ] **Step 1: Identify visible dashboard wording defects**

Run:
- `rg -n "ecrit|oeuvre|deconnect|Parametres|demo|Preparation|reel" src/components/layout src/app/dashboard src/app/profil src/app/mon-parcours src/app/parent src/app/enseignant src/app/admin`

- [ ] **Step 2: Correct only user-facing copy**

Keep technical keys unchanged. Prefer shared copy constants when a surface is dense.

- [ ] **Step 3: Verify**

Run:
- `npm run ci:fr-copy`
- `npx tsc --noEmit`
- `npm run lint`
- `npx playwright test tests/e2e/dashboard-student-ui.spec.ts --config=playwright.config.ts`

Expected: no FR regression and dashboard UI still valid.

## Chunk 4: Exposed API Messages and Emails

### Task 4: Correct messages that can surface to users

**Files:**
- Modify: `src/app/api/**/route.ts`
- Modify: `emails/**/*.tsx`

- [ ] **Step 1: Search exposed messages**

Run:
- `rg -n "error:|message:|title:|description:" src/app/api --glob 'route.ts'`
- `rg -n "ecrit|etre|oeuvre|pedagog|reel|demo|deconnect" emails src/app/api --glob '*.ts' --glob '*.tsx'`

- [ ] **Step 2: Correct only exposed French text**

Do not modify status keys, payload keys, or programmatic enums.

- [ ] **Step 3: Verify**

Run:
- `npm run ci:fr-copy`
- `npx tsc --noEmit`
- `npm run lint`
- relevant unit tests if touched routes already have coverage

## Chunk 5: Prompts, Pedagogical Content, and Docs

### Task 5: Correct remaining language debt safely

**Files:**
- Modify: `src/lib/llm/**/*.ts`
- Modify: `src/lib/onboarding/**/*.ts`
- Modify: `README.md`
- Modify: `docs/**/*.md`

- [ ] **Step 1: Search non-UI French debt**

Run:
- `rg -n "ecrit|etre|oeuvre|pedagog|reel|Preparation|deconnect|Parametres" src/lib README.md docs`

- [ ] **Step 2: Correct prompts and docs with caution**

Preserve prompt intent and structured output requirements.

- [ ] **Step 3: Verify**

Run:
- `npm run ci:fr-copy`
- `npx tsc --noEmit`
- `npm run lint`

## Chunk 6: Final Delivery

### Task 6: Commit, push, deploy, and prove

**Files:**
- Modify: affected source files
- Modify: audit docs if updated

- [ ] **Step 1: Confirm clean verification**

Run:
- `npm run ci:fr-copy`
- `npx tsc --noEmit`
- `npm run lint`

- [ ] **Step 2: Commit**

Run:
- `git add <files>`
- `git commit -m "fix(copy): harden french language quality"`

- [ ] **Step 3: Push**

Run: `git push origin main`
Expected: push succeeds.

- [ ] **Step 4: Deploy**

Run: `bash scripts/deploy.sh root@88.99.254.59`
Expected: PM2 services restart cleanly.

- [ ] **Step 5: Revalidate production**

Run:
- `git rev-parse HEAD origin/main`
- `curl -s https://eaf.nexusreussite.academy/api/v1/health`

Expected: `local = origin = prod`.
