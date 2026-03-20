# 04 -- Tests et Pipelines CI/CD

> Audit exhaustif de l'infrastructure de tests et du pipeline CI/CD de la plateforme EAF.
> Date de l'audit : 2026-03-20

---

## 1. Inventaire des fichiers de test

### 1.1 Tests unitaires (`tests/unit/`) -- 144 fichiers

#### Agents (11 fichiers)
| Fichier | Domaine |
|---------|---------|
| `tests/unit/agents/diagnosticien.test.ts` | Agent diagnosticien |
| `tests/unit/agents/diction-analyzer.test.ts` | Analyse de diction |
| `tests/unit/agents/examiner-persona.test.ts` | Persona examinateur |
| `tests/unit/agents/pastiche.test.ts` | Agent pastiche |
| `tests/unit/agents/planner.test.ts` | Agent planificateur |
| `tests/unit/agents/policy-gate.test.ts` | Policy gate generique |
| `tests/unit/agents/policy-gate-tunisia.test.ts` | Policy gate Tunisie |
| `tests/unit/agents/rapport-auto.test.ts` | Rapport automatique |
| `tests/unit/agents/router-agent.test.ts` | Routeur d'agents |
| `tests/unit/agents/shadow-timer.test.ts` | Timer fantome |
| `tests/unit/agents/student-modeler.test.ts` | Modele etudiant |

#### API Routes (26 fichiers)
| Fichier | Domaine |
|---------|---------|
| `tests/unit/api/badges-route.test.ts` | Route badges |
| `tests/unit/api/billing-routes.test.ts` | Routes facturation |
| `tests/unit/api/carnet-route.test.ts` | Route carnet |
| `tests/unit/api/class-code-route.test.ts` | Route code de classe |
| `tests/unit/api/comment-idor.test.ts` | IDOR commentaires |
| `tests/unit/api/contact-route.test.ts` | Route contact |
| `tests/unit/api/copie-file-route.test.ts` | Route fichier copie |
| `tests/unit/api/copie-status-route.test.ts` | Route statut copie |
| `tests/unit/api/cron-session-cleanup.test.ts` | Nettoyage sessions cron |
| `tests/unit/api/csrf-route.test.ts` | Route CSRF |
| `tests/unit/api/descriptif-route.test.ts` | Route descriptif |
| `tests/unit/api/epreuves-generate-route.test.ts` | Generation epreuves |
| `tests/unit/api/export-csv-route.test.ts` | Export CSV |
| `tests/unit/api/health-route.test.ts` | Route sante |
| `tests/unit/api/langue-generate-route.test.ts` | Generation exercices langue |
| `tests/unit/api/media-route.test.ts` | Route media |
| `tests/unit/api/memory-timeline-route.test.ts` | Route timeline memoire |
| `tests/unit/api/oeuvre-choisie-route.test.ts` | Route oeuvre choisie |
| `tests/unit/api/oral-audio-turn.test.ts` | Tour audio oral |
| `tests/unit/api/oral-interact-entretien.test.ts` | Interaction entretien oral |
| `tests/unit/api/oral-jury-respond-route.test.ts` | Reponse jury oral |
| `tests/unit/api/teacher-rbac-scope.test.ts` | RBAC enseignant scope |
| `tests/unit/api/teacher-routes-degraded.test.ts` | Routes enseignant degradees |
| `tests/unit/api/tuteur-message-route.test.ts` | Route message tuteur |
| `tests/unit/api/vitals-route.test.ts` | Route vitals |

#### Auth (3 fichiers)
| Fichier | Domaine |
|---------|---------|
| `tests/unit/auth/password.test.ts` | Validation mot de passe |
| `tests/unit/auth/reset-password-schema.test.ts` | Schema reset password |
| `tests/unit/auth/session.test.ts` | Gestion session |

#### Billing (6 fichiers)
| Fichier | Domaine |
|---------|---------|
| `tests/unit/billing/fallback-prod.test.ts` | Fallback production |
| `tests/unit/billing/library-gating.test.ts` | Gating bibliotheque |
| `tests/unit/billing/plan-catalog-logic.test.ts` | Logique catalogue plans |
| `tests/unit/billing/quotas-single-source.test.ts` | Source unique quotas |
| `tests/unit/billing/quotas.test.ts` | Quotas generaux |
| `tests/unit/billing/upgrade-multimonth.test.ts` | Upgrade multi-mois |

#### Cache (1 fichier)
| Fichier | Domaine |
|---------|---------|
| `tests/unit/cache/lru.test.ts` | Cache LRU |

#### Compliance (1 fichier)
| Fichier | Domaine |
|---------|---------|
| `tests/unit/compliance/anti-triche.test.ts` | Anti-triche |

#### Components (6 fichiers .tsx)
| Fichier | Domaine |
|---------|---------|
| `tests/unit/components/chat-tuteur.test.tsx` | Composant chat tuteur |
| `tests/unit/components/countdown.test.tsx` | Composant compte a rebours |
| `tests/unit/components/oral-simulator.test.tsx` | Simulateur oral |
| `tests/unit/components/quiz-player.test.tsx` | Lecteur quiz |
| `tests/unit/components/rapport-correction.test.tsx` | Rapport correction |
| `tests/unit/components/upload-copie.test.tsx` | Upload copie |

#### Config (1 fichier)
| Fichier | Domaine |
|---------|---------|
| `tests/unit/config/tunisia.test.ts` | Configuration Tunisie |

#### Correction (6 fichiers)
| Fichier | Domaine |
|---------|---------|
| `tests/unit/correction/annotation-mapper.test.ts` | Mapping annotations |
| `tests/unit/correction/correcteur.test.ts` | Correcteur |
| `tests/unit/correction/ocr.test.ts` | OCR |
| `tests/unit/correction/report-generator.test.ts` | Generateur de rapports |
| `tests/unit/correction/rubrique.test.ts` | Rubriques |
| `tests/unit/correction/worker.test.ts` | Worker correction |

#### Data (2 fichiers)
| Fichier | Domaine |
|---------|---------|
| `tests/unit/data/media-catalog.test.ts` | Catalogue medias |
| `tests/unit/data/programme-coherence.test.ts` | Coherence programme |

#### Gamification (1 fichier)
| Fichier | Domaine |
|---------|---------|
| `tests/unit/gamification/badges.test.ts` | Badges gamification |

#### Hooks (1 fichier)
| Fichier | Domaine |
|---------|---------|
| `tests/unit/hooks/use-dashboard.test.ts` | Hook dashboard |

#### Langue (1 fichier)
| Fichier | Domaine |
|---------|---------|
| `tests/unit/langue/exercise-bank.test.ts` | Banque d'exercices langue |

#### LLM (14 fichiers)
| Fichier | Domaine |
|---------|---------|
| `tests/unit/llm/agent-base.test.ts` | Agent de base |
| `tests/unit/llm/cost-tracker.test.ts` | Suivi couts |
| `tests/unit/llm/guardrail-integration.test.ts` | Integration guardrails |
| `tests/unit/llm/guardrails.test.ts` | Guardrails |
| `tests/unit/llm/mistral-router.test.ts` | Routeur Mistral |
| `tests/unit/llm/no-url-guardrail.test.ts` | Guardrail sans URL |
| `tests/unit/llm/orchestrator.test.ts` | Orchestrateur LLM |
| `tests/unit/llm/provider-factory.test.ts` | Factory providers |
| `tests/unit/llm/rate-limiter.test.ts` | Rate limiter LLM |
| `tests/unit/llm/skills/coach_ecrit.test.ts` | Skill coach ecrit |
| `tests/unit/llm/skills/coach_oral.test.ts` | Skill coach oral |
| `tests/unit/llm/skills/correcteur.test.ts` | Skill correcteur |
| `tests/unit/llm/skills/no-urls-in-schemas.test.ts` | Pas d'URLs dans schemas |
| `tests/unit/llm/skills/quiz_maitre.test.ts` | Skill quiz maitre |
| `tests/unit/llm/skills/tuteur_libre.test.ts` | Skill tuteur libre |
| `tests/unit/llm/token-estimate.test.ts` | Estimation tokens |

#### Memory (4 fichiers)
| Fichier | Domaine |
|---------|---------|
| `tests/unit/memory/context-builder.test.ts` | Constructeur contexte |
| `tests/unit/memory/scoring.test.ts` | Scoring memoire |
| `tests/unit/memory/streak.test.ts` | Series (streak) |
| `tests/unit/memory/weak-signals.test.ts` | Signaux faibles |

#### Notifications (1 fichier)
| Fichier | Domaine |
|---------|---------|
| `tests/unit/notifications/templates.test.ts` | Templates notifications |

#### Onboarding (1 fichier)
| Fichier | Domaine |
|---------|---------|
| `tests/unit/onboarding/copy-analysis.test.ts` | Analyse copie onboarding |

#### Oral (7 fichiers)
| Fichier | Domaine |
|---------|---------|
| `tests/unit/oral/chrono.test.ts` | Chronometre oral |
| `tests/unit/oral/entretien-oeuvre.test.ts` | Entretien oeuvre |
| `tests/unit/oral/evaluator.test.ts` | Evaluateur oral |
| `tests/unit/oral/extraits.test.ts` | Extraits oral |
| `tests/unit/oral/scoring.test.ts` | Scoring oral |
| `tests/unit/oral/session.test.ts` | Session oral |
| `tests/unit/oral/state-machine.test.ts` | Machine a etats oral |

#### Parcours (1 fichier)
| Fichier | Domaine |
|---------|---------|
| `tests/unit/parcours/recommender.test.ts` | Recommandeur parcours |

#### Parent (1 fichier)
| Fichier | Domaine |
|---------|---------|
| `tests/unit/parent/digest.test.ts` | Digest parent |

#### Payments (2 fichiers)
| Fichier | Domaine |
|---------|---------|
| `tests/unit/payments/callback-idempotence.test.ts` | Idempotence callback |
| `tests/unit/payments/clictopay.test.ts` | ClicToPay |

#### PDF (1 fichier)
| Fichier | Domaine |
|---------|---------|
| `tests/unit/pdf/generator.test.ts` | Generateur PDF |

#### Portfolio (1 fichier)
| Fichier | Domaine |
|---------|---------|
| `tests/unit/portfolio/export.test.ts` | Export portfolio |

#### Queue (2 fichiers)
| Fichier | Domaine |
|---------|---------|
| `tests/unit/queue/correction-queue.test.ts` | Queue de correction |
| `tests/unit/queue/correction-queue-degraded.test.ts` | Queue correction degradee |

#### Quiz (1 fichier)
| Fichier | Domaine |
|---------|---------|
| `tests/unit/quiz/adaptive.test.ts` | Quiz adaptatif |

#### RAG (8 fichiers)
| Fichier | Domaine |
|---------|---------|
| `tests/unit/rag/chunker.test.ts` | Chunker RAG |
| `tests/unit/rag/external-client.test.ts` | Client externe RAG |
| `tests/unit/rag/golden-queries.test.ts` | Requetes de reference |
| `tests/unit/rag/hybrid-search.test.ts` | Recherche hybride |
| `tests/unit/rag/indexer.test.ts` | Indexeur RAG |
| `tests/unit/rag/ingestion-pipeline.test.ts` | Pipeline d'ingestion |
| `tests/unit/rag/rerank.test.ts` | Re-classement |
| `tests/unit/rag/rrf-fusion.test.ts` | Fusion RRF |
| `tests/unit/rag/vector-search.test.ts` | Recherche vectorielle |

#### RGPD (1 fichier)
| Fichier | Domaine |
|---------|---------|
| `tests/unit/rgpd/consent.test.ts` | Consentement RGPD |

#### Security (8 fichiers)
| Fichier | Domaine |
|---------|---------|
| `tests/unit/security/clictopay-hmac.test.ts` | HMAC ClicToPay |
| `tests/unit/security/csrf.test.ts` | CSRF |
| `tests/unit/security/csrf-client.test.ts` | CSRF client |
| `tests/unit/security/file-validator.test.ts` | Validateur fichier |
| `tests/unit/security/prompt-injection.test.ts` | Injection prompt |
| `tests/unit/security/rate-limit.test.ts` | Rate limit |
| `tests/unit/security/rbac.test.ts` | RBAC |
| `tests/unit/security/sanitize.test.ts` | Sanitisation |

#### Skills (1 fichier)
| Fichier | Domaine |
|---------|---------|
| `tests/unit/skills/agent-schemas.test.ts` | Schemas agents |

#### Spaced Repetition (1 fichier)
| Fichier | Domaine |
|---------|---------|
| `tests/unit/spaced-repetition/sm2.test.ts` | Algorithme SM2 |

#### Store (1 fichier)
| Fichier | Domaine |
|---------|---------|
| `tests/unit/store/premium-store.test.ts` | Store premium |

#### Validation (2 fichiers)
| Fichier | Domaine |
|---------|---------|
| `tests/unit/validation/new-schemas.test.ts` | Nouveaux schemas |
| `tests/unit/validation/request.test.ts` | Validation requetes |

#### Racine de tests/unit/ (fichiers non categorises, 15 fichiers)
| Fichier | Domaine |
|---------|---------|
| `tests/unit/badges.test.ts` | Badges (legacy) |
| `tests/unit/correcteur.test.ts` | Correcteur (legacy) |
| `tests/unit/cost-tracker-v2.test.ts` | Cost tracker v2 |
| `tests/unit/langue-evaluation.test.ts` | Evaluation langue |
| `tests/unit/mcp-client.test.ts` | Client MCP |
| `tests/unit/middleware-public-routes.test.ts` | Middleware routes publiques |
| `tests/unit/mistral-ocr.test.ts` | OCR Mistral |
| `tests/unit/mistral-router-v2.test.ts` | Routeur Mistral v2 |
| `tests/unit/oral-capabilities.test.ts` | Capacites oral |
| `tests/unit/oral-session.test.ts` | Session oral (legacy) |
| `tests/unit/orchestrator.test.ts` | Orchestrateur (legacy) |
| `tests/unit/pages/loading.test.ts` | Page loading |
| `tests/unit/policy-gate-tunisia.test.ts` | Policy gate Tunisie (legacy) |
| `tests/unit/rag-search.test.ts` | Recherche RAG (legacy) |
| `tests/unit/rappel-agent-mcp.test.ts` | Rappel agent MCP |
| `tests/unit/spaced-repetition.test.ts` | Repetition espacee (legacy) |
| `tests/unit/upload-copie.test.ts` | Upload copie (legacy) |
| `tests/unit/vector-search.test.ts` | Recherche vectorielle (legacy) |

---

### 1.2 Tests d'integration (`tests/integration/`) -- 22 fichiers

#### API (11 fichiers)
| Fichier | Domaine |
|---------|---------|
| `tests/integration/api/auth.test.ts` | Auth API |
| `tests/integration/api/enseignant.test.ts` | API enseignant |
| `tests/integration/api/epreuves.test.ts` | API epreuves |
| `tests/integration/api/oral.test.ts` | API oral |
| `tests/integration/api/oral-route.test.ts` | Route oral |
| `tests/integration/api/parcours.test.ts` | API parcours |
| `tests/integration/api/quiz.test.ts` | API quiz |
| `tests/integration/api/rag.test.ts` | API RAG |
| `tests/integration/api/rag-route.test.ts` | Route RAG |
| `tests/integration/api/tuteur.test.ts` | API tuteur |
| `tests/integration/api/tuteur-route.test.ts` | Route tuteur |

#### DB (4 fichiers)
| Fichier | Domaine |
|---------|---------|
| `tests/integration/db/copie.test.ts` | DB copie |
| `tests/integration/db/memory-events.test.ts` | DB evenements memoire |
| `tests/integration/db/oral-session.test.ts` | DB session oral |
| `tests/integration/db/user-repo.test.ts` | DB repo utilisateur |
| `tests/integration/db/vector-search.test.ts` | DB recherche vectorielle |

#### External (1 fichier)
| Fichier | Domaine |
|---------|---------|
| `tests/integration/external/mistral.test.ts` | Integration Mistral |

#### RAG (1 fichier)
| Fichier | Domaine |
|---------|---------|
| `tests/integration/rag/external-rag.prod-guard.test.ts` | Guard RAG externe prod |

#### Racine integration (4 fichiers)
| Fichier | Domaine |
|---------|---------|
| `tests/integration/orchestrator-pipeline.test.ts` | Pipeline orchestrateur |
| `tests/integration/oral-session-flow.test.ts` | Flow session oral |
| `tests/integration/rag-pipeline.test.ts` | Pipeline RAG |
| `tests/integration/router-agent.test.ts` | Routeur agent |

---

### 1.3 Tests E2E (`tests/e2e/`) -- 16 fichiers (Playwright)

| Fichier | Domaine |
|---------|---------|
| `tests/e2e/admin.spec.ts` | Administration |
| `tests/e2e/atelier-ecrit.spec.ts` | Atelier ecrit |
| `tests/e2e/atelier-oral.spec.ts` | Atelier oral |
| `tests/e2e/descriptif-carnet.spec.ts` | Descriptif carnet |
| `tests/e2e/espace-enseignant.spec.ts` | Espace enseignant |
| `tests/e2e/flows.spec.ts` | Flux generaux |
| `tests/e2e/inscription-workflow.spec.ts` | Workflow inscription |
| `tests/e2e/mobile.spec.ts` | Mobile |
| `tests/e2e/navigation.spec.ts` | Navigation |
| `tests/e2e/onboarding.spec.ts` | Onboarding |
| `tests/e2e/parcours.spec.ts` | Parcours |
| `tests/e2e/payment-flow.spec.ts` | Flux paiement |
| `tests/e2e/platform.spec.ts` | Plateforme |
| `tests/e2e/quiz-adaptatif.spec.ts` | Quiz adaptatif |
| `tests/e2e/securite.spec.ts` | Securite |
| `tests/e2e/tuteur-chat.spec.ts` | Chat tuteur |

---

### 1.4 Tests visuels (`tests/visual/`) -- 3 specs + 1 setup

| Fichier | Type |
|---------|------|
| `tests/visual/auth.setup.ts` | Setup : cree un compte utilisateur, sauvegarde le storageState |
| `tests/visual/visual-regression.spec.ts` | Pages publiques (landing, login, contact, CGU, mentions, pricing) -- light + dark |
| `tests/visual/connected-visual.spec.ts` | Pages connectees (dashboard, carnet, atelier-ecrit, mon-parcours, profil, quiz) -- light + dark |
| `tests/visual/mobile-visual.spec.ts` | Pages mobiles (landing, login, contact, dashboard, atelier-ecrit, mon-parcours) |

Snapshots de reference stockees dans les repertoires `*-snapshots/` adjacents aux spec files.

---

### 1.5 Tests de contrat (`tests/contracts/`) -- 11 fichiers

| Fichier | Type |
|---------|------|
| `tests/contracts/openapi.public.yaml` | Schema OpenAPI public |
| `tests/contracts/openapi.auth.yaml` | Schema OpenAPI authentifie |
| `tests/contracts/openapi.teacher.allowed.yaml` | Schema OpenAPI enseignant (routes autorisees) |
| `tests/contracts/openapi.teacher.forbidden.yaml` | Schema OpenAPI enseignant (routes interdites) |
| `tests/contracts/run-schemathesis.sh` | Runner Schemathesis public |
| `tests/contracts/run-schemathesis-auth.sh` | Runner Schemathesis authentifie |
| `tests/contracts/run-schemathesis-teacher-rbac.sh` | Runner Schemathesis RBAC enseignant |
| `tests/contracts/run-teacher-comment-rbac.sh` | Assertions RBAC commentaire enseignant |
| `tests/contracts/run-teacher-export-rbac.sh` | Assertions RBAC export enseignant |
| `tests/contracts/bootstrap-roles.mjs` | Bootstrap des roles pour les tests |
| `tests/contracts/bootstrap-teacher-copies.mjs` | Bootstrap des copies enseignant pour les tests |

---

### 1.6 Tests MCP (`packages/mcp-server/tests/`) -- 2 fichiers

| Fichier | Domaine |
|---------|---------|
| `packages/mcp-server/tests/mcp-server.test.ts` | Test serveur MCP |
| `packages/mcp-server/tests/skill-delta.test.ts` | Test skill delta MCP |

---

### 1.7 Tests de performance (`tests/performance/`) -- 1 fichier

| Fichier | Domaine |
|---------|---------|
| `tests/performance/load-test.yml` | Configuration Artillery : 4 phases (warm up 10 rps, nominal 50 rps, pic 200 rps, cool down), seuils p95 < 800ms / p99 < 2s / 5xx < 0.1% |

---

### 1.8 Tests de securite (`tests/security/`) -- 1 fichier

| Fichier | Domaine |
|---------|---------|
| `tests/security/run-zap.sh` | Script OWASP ZAP : scan actif de l'API, echec si alertes HIGH detectees |

---

### 1.9 Tests Golden (docs)

| Fichier | Domaine |
|---------|---------|
| `docs/golden_tests_tunisia_playwright_bundle/tests/golden_tunisia.spec.ts` | Tests golden Tunisie (Playwright) |

---

## 2. Scripts npm lies aux tests, build, deploy, linting

### Tests

| Script | Commande | Description |
|--------|----------|-------------|
| `test` | `npm run test:unit && npm run test:e2e` | Lance unit + E2E |
| `test:unit` | `vitest run` | Tests unitaires via Vitest |
| `test:e2e` | `playwright test --config=playwright.config.ts` | Tests E2E Playwright |
| `test:all` | `npm run test:unit && npm run mcp:test` | Unit + MCP |
| `test:ops` | `bash scripts/run-all-tests.sh` | Script complet (unit, MCP, build, guide E2E) |
| `test:contracts` | `bash tests/contracts/run-schemathesis.sh` | Contrats publics Schemathesis |
| `test:contracts:auth` | `bash tests/contracts/run-schemathesis-auth.sh` | Contrats authentifies |
| `test:contracts:teacher-rbac` | `bash tests/contracts/run-schemathesis-teacher-rbac.sh` | Contrats RBAC enseignant |
| `test:contracts:teacher-comment-rbac` | `bash tests/contracts/run-teacher-comment-rbac.sh` | RBAC commentaire enseignant |
| `test:contracts:teacher-export-rbac` | `bash tests/contracts/run-teacher-export-rbac.sh` | RBAC export enseignant |
| `test:mutation` | `stryker run` | Tests de mutation Stryker |
| `test:visual` | `playwright test --config=playwright.visual.config.ts` | Regression visuelle tous projets |
| `test:visual:update` | `playwright test --config=playwright.visual.config.ts --update-snapshots` | MAJ snapshots visuels |
| `test:visual:public` | `... --project=public-visual` | Visuels pages publiques |
| `test:visual:connected` | `... --project=connected-visual` | Visuels pages connectees |
| `test:visual:mobile` | `... --project=mobile-visual` | Visuels mobile |
| `mcp:test` | `cd packages/mcp-server && vitest run` | Tests MCP |

### Build

| Script | Commande | Description |
|--------|----------|-------------|
| `build` | `next build` | Build Next.js |
| `build:ci` | `next build --webpack` | Build CI (webpack) |
| `mcp:build` | `cd packages/mcp-server && tsc` | Build MCP |

### Deploy / Infra

| Script | Commande | Description |
|--------|----------|-------------|
| `start` | `next start` | Demarrer le serveur |
| `dev` | `next dev` | Mode developpement |
| `setup` | `bash scripts/setup.sh` | Installation initiale |
| `prisma:generate` | `prisma generate` | Generer client Prisma |
| `prisma:migrate` | `prisma migrate dev` | Migrations dev |
| `db:seed` | `tsx scripts/seed.ts` | Seed base de donnees |
| `db:seed:media` | `tsx scripts/ingest-media-catalog.ts` | Seed catalogue medias |
| `rag:index` | `tsx scripts/index-rag.ts` | Indexation RAG |
| `scheduler` | `tsx src/lib/cron/scheduler.ts` | Lanceur cron |
| `mcp:dev` | `cd packages/mcp-server && tsx watch src/index.ts` | MCP mode dev |
| `mcp:start` | `cd packages/mcp-server && node dist/index.js` | MCP production |
| `mcp:inspect` | `npx @modelcontextprotocol/inspector tsx src/index.ts` | Inspecteur MCP |
| `mcp:init` | Script Node inline | Generer cle API MCP |

### Linting / Qualite

| Script | Commande | Description |
|--------|----------|-------------|
| `lint` | `eslint` | Linting ESLint |
| `typecheck` | `tsc --noEmit` | Verification TypeScript stricte |
| `ci:config-sanity` | `node scripts/check-env.js` | Verification sante config |
| `ci:audit-csrf` | `node scripts/audit-csrf-routes.mjs` | Audit CSRF des routes |
| `ci:fr-copy` | `tsx scripts/check-fr-copy.ts` | Controle copie francaise |
| `pw:webserver` | `tsx scripts/pw_webserver_local.ts` | Webserver local Playwright |

---

## 3. Pipeline CI/CD (`.github/workflows/ci-cd.yml`)

### Declencheurs

| Evenement | Condition |
|-----------|-----------|
| `push` | Branches `main`, `develop`, `feature/**` ; tags `v*.*.*` |
| `pull_request` | Branches `main`, `develop` |
| `schedule` | Lundi 02h UTC (hebdo) ; 1er du mois 03h UTC (mensuel) |
| `workflow_dispatch` | Manuel |

### Jobs et Gates

```
Gate 1 (static-analysis)
   |
Gate 2 (unit-tests)  [needs: Gate 1]
   |
   +--- Gate 3  (integration-tests)  [needs: Gate 2]
   |       |
   |       +--- Gate 3b (contract-tests) [needs: Gate 3]
   |       |
   |       +--- Gate 5b (performance-tests) [needs: Gate 3, si tag ou dispatch]
   |       |
   |       +--- Gate 5c (zap-security-tests) [needs: Gate 3, si dispatch ou schedule lundi]
   |
   +--- Gate 5  (security-scan) [needs: Gate 2]
   |
   +--- Gate 5d (mutation-tests) [needs: Gate 2, si dispatch ou schedule mensuel]
   |
Gate 4 (e2e-tests) [needs: Gate 3 + Gate 3b]
   |
Gate 6 (deploy-staging) [needs: Gate 4 + Gate 5, si develop]
Gate 6b (deploy-production) [needs: Gate 4 + Gate 5, si main]
   |
Post-Deploy (health monitoring) [needs: Gate 6b, si main]
```

### Detail des jobs

#### Gate 1 -- Analyse Statique (`static-analysis`)
- **Runner** : ubuntu-22.04
- **Steps** :
  1. TypeScript strict check (`tsc --noEmit`)
  2. ESLint (`npm run lint`)
  3. Audit CSRF routes (`npm run ci:audit-csrf`)
  4. Controle copie FR (`npm run ci:fr-copy`)
  5. Audit dependances npm (`npx audit-ci --high`)
  6. Detection code mort (`npx knip`)

#### Gate 2 -- Tests Unitaires (`unit-tests`)
- **Runner** : ubuntu-22.04
- **Services** : Redis 7 Alpine
- **Steps** :
  1. `npx vitest run tests/unit --coverage`
  2. Coverage gate progressif (4 metriques)
- **Note** : 114 fichiers de test mentionnes dans le nom du job (reellement 144 dans le repertoire)

#### Gate 3 -- Tests Integration (`integration-tests`)
- **Runner** : ubuntu-22.04
- **Services** : PostgreSQL 16 (pgvector), Redis 7
- **Steps** :
  1. `npx prisma migrate deploy`
  2. Seed test si script existe
  3. `npx vitest run tests/integration`

#### Gate 3b -- API Contract Tests (`contract-tests`)
- **Runner** : ubuntu-22.04
- **Services** : PostgreSQL 16 (pgvector), Redis 7
- **Steps** :
  1. Build CI + demarrage serveur
  2. Schemathesis public contracts
  3. Schemathesis authenticated contracts
  4. Schemathesis teacher RBAC contracts
  5. Teacher comment RBAC assertions
  6. Teacher export RBAC assertions
- **Artifacts** : Logs Schemathesis uploades

#### Gate 4 -- Tests E2E Playwright (`e2e-tests`)
- **Runner** : ubuntu-22.04
- **Services** : PostgreSQL 16 (pgvector), Redis 7
- **Steps** :
  1. Reset DB + extensions (pgcrypto, vector)
  2. `prisma db push`, seed, build
  3. `playwright test --project=chromium`
- **Artifacts** : Rapport Playwright uploade en cas d'echec

#### Gate 5 -- Securite (`security-scan`)
- **Runner** : ubuntu-22.04
- **Steps** :
  1. `npm audit --audit-level=high`
  2. GitLeaks (scan secrets) -- continue-on-error, echoue seulement si vraies fuites SARIF
  3. Snyk (si SNYK_TOKEN configure) -- sinon skip gracieux
  4. CodeQL init + build + analyze (TypeScript)

#### Gate 5b -- Performance Artillery (`performance-tests`)
- **Condition** : `workflow_dispatch` ou tag `v*`
- **Steps** : `npx artillery run tests/performance/load-test.yml`

#### Gate 5c -- OWASP ZAP (`zap-security-tests`)
- **Condition** : `workflow_dispatch` ou schedule lundi
- **Steps** : `bash tests/security/run-zap.sh`

#### Gate 5d -- Mutation Tests (`mutation-tests`)
- **Condition** : `workflow_dispatch` ou schedule mensuel (1er du mois)
- **Steps** : `npm run test:mutation` via Stryker
- **Artifacts** : Logs Stryker et rapports mutation uploades

#### Gate 6 -- Deploy Staging (`deploy-staging`)
- **Condition** : branche `develop`
- **Environment** : staging
- **Steps** : SSH vers serveur staging, pull, npm ci, prisma migrate, pm2 reload

#### Gate 6b -- Deploy Production (`deploy-production`)
- **Condition** : branche `main`
- **Environment** : production
- **Strategy** : Blue-Green deploy
- **Steps** :
  1. Verification secrets production
  2. Config sanity check
  3. SSH blue-green deploy avec smoke test (30 tentatives, 2s interval)
  4. Switch nginx + cleanup ancien slot

#### Post-Deploy -- Health & Canary (`post-deploy-monitoring`)
- **Condition** : branche `main`, apres deploy production
- **Steps** : Health check toutes les 10s pendant 5 minutes (30 verifications)

---

## 4. Coverage Gates et seuils de qualite

### Couverture de code (Vitest + CI)

| Metrique | Seuil actuel | Commentaire |
|----------|-------------|-------------|
| Lines | 30% | Baisse a 30% le 2026-03-15 (couverture reelle ~35%) |
| Functions | 27% | Idem |
| Branches | 24% | Idem |
| Statements | 30% | Idem |

Les seuils sont definis a trois endroits (synchronises) :
1. `vitest.config.ts` -- `coverage.thresholds`
2. `.github/workflows/ci-cd.yml` -- variables d'environnement `COVERAGE_GATE_*`
3. `.github/workflows/ci-cd.yml` -- script Node inline de verification

> **Note** : Le plan progressif prevoit +2% par sprint.

### Mutation Testing (Stryker)

| Metrique | Seuil |
|----------|-------|
| `high` | 80% |
| `low` | 70% |
| `break` | 65% |

Fichiers mutes :
- `src/lib/security/file-validator.ts`
- `src/lib/security/llm-rate-limiter.ts`
- `src/lib/rag/rerank.ts`

### Performance (Artillery)

| Metrique | Seuil |
|----------|-------|
| p95 response time | < 800ms |
| p99 response time | < 2000ms |
| 5xx rate | < 0.1% |

### Securite

| Outil | Seuil |
|-------|-------|
| npm audit | high severity |
| audit-ci | high severity |
| Snyk | high severity (si token configure) |
| GitLeaks | 0 secrets detectes |
| CodeQL | Analyse TypeScript |
| OWASP ZAP | 0 alertes HIGH |

---

## 5. Fichiers de configuration et helpers de test

### Configurations de test

| Fichier | Role |
|---------|------|
| `vitest.config.ts` | Config Vitest principale : include unit + integration, env node, pool forks, timeout 15s, coverage v8 |
| `packages/mcp-server/vitest.config.ts` | Config Vitest MCP : env node, tests dans `tests/**/*.test.ts` |
| `playwright.config.ts` | Config Playwright E2E : testDir `tests/e2e`, project chromium, timeout 60s, retries 1 en CI, webServer auto |
| `playwright.visual.config.ts` | Config Playwright visuel : 4 projets (setup, public-visual, connected-visual, mobile-visual), viewport fixe 1280x720, maxDiffPixelRatio 0.01 |
| `tsconfig.test.json` | Config TypeScript pour tests : extends tsconfig.json, types vitest/globals + node |
| `stryker.conf.json` | Config mutation testing : runner vitest, 3 fichiers mutes, seuil break 65% |

### Fixtures

| Fichier | Role |
|---------|------|
| `tests/fixtures/copie-test.png` | Image de test pour upload de copie |

### Setup files

| Fichier | Role |
|---------|------|
| `tests/visual/auth.setup.ts` | Cree un compte utilisateur ephemere et sauvegarde storageState pour les tests visuels connectes |
| `tests/contracts/bootstrap-roles.mjs` | Bootstrap des roles dans la DB pour les tests de contrat |
| `tests/contracts/bootstrap-teacher-copies.mjs` | Bootstrap des copies enseignant pour les tests de contrat |

### Scripts d'orchestration

| Fichier | Role |
|---------|------|
| `scripts/run-all-tests.sh` | Script complet : Phase 1 (unit+E2E), Phase 2 (MCP), Phase 3 (build), Phase 4 (guide manuel pour contracts/visual) |

### Variables d'environnement de test (definies dans vitest.config.ts)

| Variable | Valeur |
|----------|--------|
| `LLM_ROUTER_ENABLED` | `false` |
| `LLM_COST_TRACKING` | `false` |
| `DATABASE_URL` | `postgresql://test:test@localhost:5432/eaf_test` |
| `REDIS_URL` | `redis://localhost:6379` |
| `MCP_SERVER_URL` | `http://localhost:3100` |
| `MCP_API_KEY` | `test-key` |
| `SESSION_SECRET` | `test-secret-minimum-32-chars-long` |
| `CSRF_SECRET` | `test-csrf-secret-minimum-32-chars` |
| `COOKIE_SECURE` | `false` |
| `NODE_ENV` | `test` |

---

## 6. Resume quantitatif

| Categorie | Nombre de fichiers |
|-----------|-------------------|
| Tests unitaires | 144 |
| Tests integration | 22 |
| Tests E2E | 16 |
| Tests visuels | 3 specs + 1 setup |
| Tests de contrat | 4 schemas OpenAPI + 5 runners + 2 bootstraps |
| Tests MCP | 2 |
| Tests performance | 1 (Artillery) |
| Tests securite | 1 (ZAP) |
| Tests golden | 1 |
| **Total fichiers de test** | **~197** |

| Categorie CI | Nombre de jobs |
|-------------|----------------|
| Gates obligatoires (chaque PR) | 5 (static, unit, integration, contract, e2e) |
| Gates securite | 1 obligatoire (security-scan) + 1 conditionnel (ZAP) |
| Gates conditionnels | 2 (performance, mutation) |
| Deploy | 2 (staging, production) |
| Post-deploy | 1 (health monitoring) |
| **Total jobs CI/CD** | **11** |
