# Descriptif Lecture and Official Rubrics Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace legacy oral reading-list storage with a single canonical descriptif model, align oral simulation with the student’s real descriptif, and replace written/oral evaluation references with official EAF rules.

**Architecture:** Prisma becomes the sole source of truth through a new `TexteDescriptif` model linked to `User`. All read/write paths for `/descriptif-lecture`, oral tirage, memory/MCP context, and pedagogical rubrics are rewired to this model and to official reference data. Legacy rows are archived and migrated once before destructive schema removal.

**Tech Stack:** Next.js App Router, TypeScript, Prisma/PostgreSQL, Vitest, PM2 deployment script

---

## Chunk 1: Schema and Data Migration

### Task 1: Replace legacy descriptif models with a canonical Prisma model

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_unify_texte_descriptif/*`

- [ ] Add `ObjetEtude` and `TypeTexteDescriptif` enums.
- [ ] Add `TexteDescriptif` model linked to `User`.
- [ ] Add `textesDescriptif TexteDescriptif[]` to `User`.
- [ ] Remove `TextePrepare` and `DescriptifTexte` from schema.
- [ ] Run `npx prisma migrate dev --name "unify_texte_descriptif"` and `npx prisma generate`.
- [ ] Run `npm run typecheck` and fix all errors before continuing.

### Task 2: Migrate legacy descriptif data safely

**Files:**
- Create: `scripts/migrate-legacy-descriptif.ts`

- [ ] Read legacy rows from `TextePrepare` and `DescriptifTexte`.
- [ ] Archive raw rows to `.data/migration-backups/<timestamp>_texte_descriptif/`.
- [ ] Infer `objetEtude` from official author names first, then fallback to `ROMAN_RECIT`.
- [ ] Infer `typeTexte` when possible, otherwise fallback to `EXTRAIT_OEUVRE`.
- [ ] Upsert into `TexteDescriptif`.
- [ ] Run the script locally, inspect output, then run `npm run typecheck`.

## Chunk 2: API and Student UI

### Task 3: Rewrite descriptif API routes

**Files:**
- Modify: `src/app/api/v1/student/descriptif-lecture/route.ts`
- Create/Modify: `src/app/api/v1/student/descriptif-lecture/[texteId]/route.ts`
- Create/Modify: `src/app/api/v1/student/descriptif-lecture/[texteId]/upload/route.ts`

- [ ] Replace `textePrepare` CRUD with `texteDescriptif`.
- [ ] Add regulatory conformity stats in `GET`.
- [ ] Add `POST`, `PUT`, `PATCH`, `DELETE`, and upload support.
- [ ] Reuse existing auth/CSRF/storage conventions from the codebase.
- [ ] Run `npm run typecheck` before moving on.

### Task 4: Replace the `/descriptif-lecture` page

**Files:**
- Modify: `src/app/descriptif-lecture/page.tsx`
- Create/Modify: `src/app/descriptif-lecture/TexteCard.tsx`
- Create/Modify: `src/app/descriptif-lecture/AddTexteForm.tsx`
- Create: `src/data/programme-eaf-2025.ts`

- [ ] Add the official programme constants and grammar themes.
- [ ] Build the 4-tab UI by objet d’étude with conformity indicators.
- [ ] Support add/edit/delete/upload flows against the rewritten API.
- [ ] Keep route path `/descriptif-lecture`.
- [ ] Run `npm run typecheck`.

## Chunk 3: Oral, Context, MCP, Navigation

### Task 5: Make oral session start rely on the official descriptif

**Files:**
- Modify: `src/app/api/v1/oral/session/start/route.ts`
- Create: `src/lib/llm/skills/oral-grammaire-generateur.ts`
- Create: `src/lib/llm/skills/oral-grammaire-evaluateur.ts`

- [ ] Replace `pickOralExtrait()` usage with `choisirExtraitOfficiel()`.
- [ ] Pull only `EXTRAIT_OEUVRE` and `EXTRAIT_PARCOURS`.
- [ ] Emit explicit warning when fallback programme is used.
- [ ] Keep quota/auth/rate-limit behavior unchanged.
- [ ] Run `npm run typecheck`.

### Task 6: Inject descriptif into student context surfaces

**Files:**
- Modify: `src/lib/memory/context-builder.ts` or its upstream builder callers
- Modify: `packages/mcp-server/src/tools/student/get-profile.ts`
- Modify: `src/components/layout/student-navigation.ts`

- [ ] Expose descriptif summaries to the memory/tutor context.
- [ ] Add descriptif aggregates to MCP `get-profile`.
- [ ] Point navigation to the canonical route and show incomplete-state signaling if already supported.
- [ ] Run `npm run typecheck`.

## Chunk 4: Official Rubrics, Tests, Release

### Task 7: Replace written rubrics with official scales

**Files:**
- Modify: `src/data/baremes-officiels.ts`
- Modify: `src/lib/llm/skills/ecrit-baremage.ts`
- Modify: `src/app/atelier-ecrit/components/EcritEpreuveSelector.tsx`
- Create: `tests/unit/pedagogy/baremes.test.ts`
- Create: `tests/integration/descriptif/*`

- [ ] Replace rubric text with the official 4-level criteria.
- [ ] Ensure no autonomous intro/conclusion criterion remains.
- [ ] Ensure grammar prompts stay syntax-only.
- [ ] Run targeted Vitest suites, then `npm run typecheck`.

### Task 8: Verify, release, deploy

**Files:**
- Modify as needed from previous tasks

- [ ] Run `npm run test:unit`.
- [ ] Run `npm run build`.
- [ ] Run grep-based regression checks required by the brief.
- [ ] Commit with the approved message.
- [ ] Push `main`.
- [ ] Deploy with `bash scripts/deploy.sh root@88.99.254.59`.
- [ ] Run protected-route and health smoke tests on production.
