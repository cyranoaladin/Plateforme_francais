# Arborescence complète utile du projet

Dernière consolidation documentaire : 14 mars 2026

Ce document décrit l’arborescence utile du dépôt dans son état courant. Il exclut volontairement les dépendances et artefacts générés non nécessaires à la compréhension du projet (`node_modules`, `.git`, secrets locaux `.env`, logs runtime, coverage, outputs temporaires, caches).

```text
.
├── .antigravity
│   ├── README.md
│   ├── manifest.json
│   ├── rules.md
│   ├── skills.md
│   └── workflow.md
├── .github
│   └── workflows
│       ├── ci-cd.yml
│       └── ci.yml
├── .superpowers
│   └── skills
│       ├── systematic-debugging
│       │   └── SKILL.md
│       ├── test-driven-development
│       │   └── SKILL.md
│       └── writing-plans
│           └── SKILL.md
├── .vscode
│   └── settings.json
├── config
│   ├── fr-copy-banned-phrases.json
│   └── fr-copy-baseline.json
├── docs
│   ├── 00_INDEX.md
│   ├── 01_SYSTEME_COMPLET.md
│   ├── 02_API_REFERENCE_COMPLETE.md
│   ├── 03_TECHNIQUE_DONNEES_IA_MCP.md
│   ├── 04_EXPLOITATION_TESTS_DEPLOIEMENT.md
│   └── 05_ARBORESCENCE_COMPLETE.md
├── packages
│   └── mcp-server
│       ├── src
│       │   ├── lib
│       │   │   ├── auth.ts
│       │   │   ├── db.ts
│       │   │   ├── logger.ts
│       │   │   ├── policy-gate.ts
│       │   │   └── redis.ts
│       │   ├── prompts
│       │   │   └── index.ts
│       │   ├── resources
│       │   │   └── index.ts
│       │   ├── tools
│       │   │   ├── rag
│       │   │   │   └── search-corpus.ts
│       │   │   ├── student
│       │   │   │   ├── error-bank.ts
│       │   │   │   └── get-profile.ts
│       │   │   └── all-tools.ts
│       │   ├── types
│       │   │   └── index.ts
│       │   ├── client.ts
│       │   ├── index.ts
│       │   ├── server.ts
│       │   └── transport-http.ts
│       ├── tests
│       │   ├── mcp-server.test.ts
│       │   └── skill-delta.test.ts
│       ├── .env.example
│       ├── .gitignore
│       ├── README.md
│       ├── mcp.config.json
│       ├── package.json
│       ├── prisma
│       ├── tsconfig.json
│       └── vitest.config.ts
├── prisma
│   ├── migrations
│   │   ├── 0001_init
│   │   │   └── migration.sql
│   │   ├── 0002_student_profile_onboarding
│   │   │   └── migration.sql
│   │   ├── 0003_profile_badges
│   │   │   └── migration.sql
│   │   ├── 0004_rag_columns_and_missing_models
│   │   │   └── migration.sql
│   │   ├── 0005_oral_eaf_conformity
│   │   │   └── migration.sql
│   │   ├── 0006_oral_v2_schema
│   │   │   └── migration.sql
│   │   ├── 0007_billing_plans_v2
│   │   │   └── migration.sql
│   │   ├── 0008_addendum_memory_store_v1
│   │   │   └── migration.sql
│   │   ├── 0009_gamification_xp_columns
│   │   │   └── migration.sql
│   │   ├── 0009_oral_oeuvre_choisie
│   │   │   └── migration.sql
│   │   ├── 0010_descriptif_lecture
│   │   │   └── migration.sql
│   │   ├── 0011_carnet_lecture
│   │   │   └── migration.sql
│   │   ├── 0012_pgvector_hnsw_index
│   │   │   └── migration.sql
│   │   ├── 0013_premium_history_and_learning_memory
│   │   │   └── migration.sql
│   │   └── migration_lock.toml
│   ├── schema.prisma
│   └── seed-official-works.ts
├── public
│   └── images
│       ├── logo.png
│       ├── logo_nexus_reussite.png
│       └── logo_slogan_nexus.png
├── scripts
│   ├── audit-csrf-routes.mjs
│   ├── check-env.js
│   ├── check-fr-copy.ts
│   ├── create-admin-production.ts
│   ├── deploy.sh
│   ├── fix-error-messages.py
│   ├── generate-env.py
│   ├── index-rag.ts
│   ├── ingest-media-catalog.ts
│   ├── nginx-eaf.conf
│   ├── pw_webserver_local.ts
│   ├── scan-ressources.ts
│   ├── seed.ts
│   ├── setup-postgres.py
│   ├── setup-server.sh
│   ├── setup.sh
│   ├── test-production-locale.sh
│   └── verify-catalog-paths.ts
├── src
│   ├── app
│   │   ├── (public)
│   │   │   └── landing
│   │   │       └── page.tsx
│   │   ├── api
│   │   │   ├── mcp
│   │   │   │   └── health
│   │   │   │       └── route.ts
│   │   │   └── v1
│   │   │       ├── auth
│   │   │       │   ├── forgot-password
│   │   │       │   │   └── route.ts
│   │   │       │   ├── login
│   │   │       │   │   └── route.ts
│   │   │       │   ├── logout
│   │   │       │   │   └── route.ts
│   │   │       │   ├── me
│   │   │       │   │   └── route.ts
│   │   │       │   ├── register
│   │   │       │   │   └── route.ts
│   │   │       │   └── reset-password
│   │   │       │       └── route.ts
│   │   │       ├── badges
│   │   │       │   ├── evaluate
│   │   │       │   │   └── route.ts
│   │   │       │   └── list
│   │   │       │       └── route.ts
│   │   │       ├── billing
│   │   │       │   ├── check-quota
│   │   │       │   │   └── route.ts
│   │   │       │   ├── redeem-code
│   │   │       │   │   └── route.ts
│   │   │       │   └── status
│   │   │       │       └── route.ts
│   │   │       ├── carnet
│   │   │       │   ├── [entryId]
│   │   │       │   │   └── route.ts
│   │   │       │   ├── entry
│   │   │       │   │   └── route.ts
│   │   │       │   ├── export
│   │   │       │   │   └── route.ts
│   │   │       │   └── route.ts
│   │   │       ├── chat
│   │   │       │   └── route.ts
│   │   │       ├── cron
│   │   │       │   ├── revision-reminders
│   │   │       │   │   └── route.ts
│   │   │       │   ├── session-cleanup
│   │   │       │   │   └── route.ts
│   │   │       │   └── weekly-reports
│   │   │       │       └── route.ts
│   │   │       ├── enseignant
│   │   │       │   ├── class-code
│   │   │       │   │   └── route.ts
│   │   │       │   ├── corrections
│   │   │       │   │   └── [copieId]
│   │   │       │   │       └── comment
│   │   │       │   │           └── route.ts
│   │   │       │   ├── dashboard
│   │   │       │   │   └── route.ts
│   │   │       │   └── export
│   │   │       │       └── route.ts
│   │   │       ├── epreuves
│   │   │       │   ├── [epreuveId]
│   │   │       │   │   └── copie
│   │   │       │   │       ├── [copieId]
│   │   │       │   │       │   └── route.ts
│   │   │       │   │       └── route.ts
│   │   │       │   ├── copies
│   │   │       │   │   └── [copieId]
│   │   │       │   │       ├── file
│   │   │       │   │       │   └── route.ts
│   │   │       │   │       └── report
│   │   │       │   │           └── route.ts
│   │   │       │   └── generate
│   │   │       │       └── route.ts
│   │   │       ├── evaluations
│   │   │       │   └── langue
│   │   │       │       └── route.ts
│   │   │       ├── exam-info
│   │   │       │   └── route.ts
│   │   │       ├── health
│   │   │       │   └── route.ts
│   │   │       ├── langue
│   │   │       │   └── generate
│   │   │       │       └── route.ts
│   │   │       ├── media
│   │   │       │   └── [id]
│   │   │       │       └── route.ts
│   │   │       ├── memory
│   │   │       │   ├── events
│   │   │       │   │   └── route.ts
│   │   │       │   └── timeline
│   │   │       │       └── route.ts
│   │   │       ├── metrics
│   │   │       │   └── vitals
│   │   │       │       └── route.ts
│   │   │       ├── onboarding
│   │   │       │   └── complete
│   │   │       │       └── route.ts
│   │   │       ├── oral
│   │   │       │   ├── capabilities
│   │   │       │   │   └── route.ts
│   │   │       │   ├── jury-respond
│   │   │       │   │   └── route.ts
│   │   │       │   ├── session
│   │   │       │   │   ├── [sessionId]
│   │   │       │   │   │   ├── end
│   │   │       │   │   │   │   └── route.ts
│   │   │       │   │   │   ├── end-prep
│   │   │       │   │   │   │   └── route.ts
│   │   │       │   │   │   ├── interact
│   │   │       │   │   │   │   └── route.ts
│   │   │       │   │   │   ├── start-passage
│   │   │       │   │   │   │   └── route.ts
│   │   │       │   │   │   └── start-prep
│   │   │       │   │   │       └── route.ts
│   │   │       │   │   └── start
│   │   │       │   │       └── route.ts
│   │   │       │   └── voice-submit
│   │   │       │       └── route.ts
│   │   │       ├── parcours
│   │   │       │   └── generate
│   │   │       │       └── route.ts
│   │   │       ├── payments
│   │   │       │   └── clictopay
│   │   │       │       ├── callback
│   │   │       │       │   └── route.ts
│   │   │       │       ├── init
│   │   │       │       │   └── route.ts
│   │   │       │       ├── public-status
│   │   │       │       │   └── route.ts
│   │   │       │       └── status
│   │   │       │           └── route.ts
│   │   │       ├── quiz
│   │   │       │   └── generate
│   │   │       │       └── route.ts
│   │   │       ├── rag
│   │   │       │   ├── health
│   │   │       │   │   └── route.ts
│   │   │       │   └── search
│   │   │       │       └── route.ts
│   │   │       ├── ressources
│   │   │       │   └── file
│   │   │       │       └── route.ts
│   │   │       ├── student
│   │   │       │   ├── descriptif
│   │   │       │   │   └── route.ts
│   │   │       │   ├── oeuvre-choisie
│   │   │       │   │   └── route.ts
│   │   │       │   ├── profile
│   │   │       │   │   └── route.ts
│   │   │       │   └── recapitulatif
│   │   │       │       └── route.ts
│   │   │       └── tuteur
│   │   │           └── message
│   │   │               └── route.ts
│   │   ├── atelier-ecrit
│   │   │   ├── correction
│   │   │   │   └── [copieId]
│   │   │   │       └── page.tsx
│   │   │   ├── loading.tsx
│   │   │   └── page.tsx
│   │   ├── atelier-langue
│   │   │   └── page.tsx
│   │   ├── atelier-oral
│   │   │   ├── loading.tsx
│   │   │   └── page.tsx
│   │   ├── bibliotheque
│   │   │   ├── loading.tsx
│   │   │   └── page.tsx
│   │   ├── bienvenue
│   │   │   ├── sections
│   │   │   │   ├── FAQ.tsx
│   │   │   │   ├── Features.tsx
│   │   │   │   ├── FinalCTA.tsx
│   │   │   │   ├── Hero.tsx
│   │   │   │   ├── HowItWorks.tsx
│   │   │   │   ├── PricingTeaser.tsx
│   │   │   │   ├── Trust.tsx
│   │   │   │   └── WhyNexus.tsx
│   │   │   └── page.tsx
│   │   ├── carnet
│   │   │   └── page.tsx
│   │   ├── dashboard
│   │   │   └── page.tsx
│   │   ├── descriptif
│   │   │   └── page.tsx
│   │   ├── enseignant
│   │   │   └── page.tsx
│   │   ├── login
│   │   │   └── page.tsx
│   │   ├── mentions-legales
│   │   │   └── page.tsx
│   │   ├── mon-parcours
│   │   │   └── page.tsx
│   │   ├── onboarding
│   │   │   └── page.tsx
│   │   ├── paiement
│   │   │   ├── confirmation
│   │   │   │   └── page.tsx
│   │   │   └── refus
│   │   │       └── page.tsx
│   │   ├── parent
│   │   │   └── page.tsx
│   │   ├── pricing
│   │   │   └── page.tsx
│   │   ├── profil
│   │   │   └── page.tsx
│   │   ├── quiz
│   │   │   └── page.tsx
│   │   ├── tuteur
│   │   │   ├── loading.tsx
│   │   │   └── page.tsx
│   │   ├── favicon.ico
│   │   ├── global-error.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── loading.tsx
│   │   ├── not-found
│   │   ├── not-found.tsx
│   │   └── page.tsx
│   ├── components
│   │   ├── accessibility
│   │   │   └── dyslexia-toggle.tsx
│   │   ├── analytics
│   │   │   └── events.ts
│   │   ├── billing
│   │   │   └── PaywallBanner.tsx
│   │   ├── consent
│   │   │   └── ConsentBanner.tsx
│   │   ├── dashboard
│   │   │   ├── parcours-recommandation.tsx
│   │   │   └── progression-chart.tsx
│   │   ├── landing
│   │   │   ├── styles
│   │   │   │   ├── faq.module.scss
│   │   │   │   ├── footer.module.scss
│   │   │   │   ├── header.module.scss
│   │   │   │   ├── hero.module.scss
│   │   │   │   ├── pricing.module.scss
│   │   │   │   ├── valueProps.module.scss
│   │   │   │   └── variables.scss
│   │   │   ├── FAQ.tsx
│   │   │   ├── Hero.tsx
│   │   │   ├── LandingFooter.tsx
│   │   │   ├── LandingHeader.tsx
│   │   │   ├── Pricing.tsx
│   │   │   ├── ValueProps.tsx
│   │   │   └── index.ts
│   │   ├── layout
│   │   │   ├── app-shell.tsx
│   │   │   └── sidebar.tsx
│   │   ├── monitoring
│   │   │   └── web-vitals-reporter.tsx
│   │   ├── public
│   │   │   ├── PublicFooter.tsx
│   │   │   └── PublicHeader.tsx
│   │   ├── theme
│   │   │   └── theme-provider.tsx
│   │   ├── tracking
│   │   │   └── tracking-provider.tsx
│   │   └── ui
│   │       ├── pdf-preview-viewer.tsx
│   │       └── state-notice.tsx
│   ├── data
│   │   ├── extraits-oeuvres.ts
│   │   ├── media-catalog.ts
│   │   ├── references.ts
│   │   ├── ressources-scan.json
│   │   └── ressources.ts
│   ├── hooks
│   │   ├── useDashboard.ts
│   │   └── useQuotaCheck.ts
│   ├── lib
│   │   ├── agents
│   │   │   ├── diction
│   │   │   │   └── diction-analyzer.ts
│   │   │   ├── pastiche
│   │   │   │   └── pastiche.ts
│   │   │   ├── prompts
│   │   │   │   └── examiner-persona.ts
│   │   │   ├── shadow-timer
│   │   │   │   └── shadow-timer.ts
│   │   │   ├── avocat-diable.ts
│   │   │   ├── diagnosticien.ts
│   │   │   ├── planner.ts
│   │   │   ├── policy-gate.ts
│   │   │   ├── rappel-agent.ts
│   │   │   ├── rapport-auto.ts
│   │   │   ├── router.ts
│   │   │   └── student-modeler.ts
│   │   ├── api
│   │   │   └── client.ts
│   │   ├── auth
│   │   │   ├── guard.ts
│   │   │   ├── session.ts
│   │   │   └── types.ts
│   │   ├── billing
│   │   │   ├── context.ts
│   │   │   ├── copy.ts
│   │   │   ├── gating.ts
│   │   │   ├── library-gating.ts
│   │   │   ├── plan-catalog.ts
│   │   │   ├── quotas.ts
│   │   │   ├── redeem.ts
│   │   │   └── usage.ts
│   │   ├── carnet
│   │   │   └── pdf.tsx
│   │   ├── compliance
│   │   │   └── anti-triche.ts
│   │   ├── config
│   │   │   └── tunisia.ts
│   │   ├── copy
│   │   │   └── fr
│   │   │       ├── api.ts
│   │   │       ├── billing.ts
│   │   │       ├── index.ts
│   │   │       ├── parents.ts
│   │   │       ├── public-footer.ts
│   │   │       ├── public-header.ts
│   │   │       ├── public-home.ts
│   │   │       ├── public-landing-footer.ts
│   │   │       ├── public-legal.ts
│   │   │       ├── public-payment.ts
│   │   │       ├── public-pricing-page.ts
│   │   │       ├── public.ts
│   │   │       ├── student-ecrit-correction.ts
│   │   │       ├── student-ecrit.ts
│   │   │       ├── student-langue.ts
│   │   │       ├── student-onboarding.ts
│   │   │       ├── student-oral.ts
│   │   │       ├── student-path.ts
│   │   │       ├── student-profile.ts
│   │   │       ├── student-tuteur.ts
│   │   │       ├── student.ts
│   │   │       ├── teacher.ts
│   │   │       ├── ui-sidebar.ts
│   │   │       └── ui.ts
│   │   ├── correction
│   │   │   ├── annotation-mapper.ts
│   │   │   ├── correcteur.ts
│   │   │   ├── ocr-result.ts
│   │   │   └── ocr.ts
│   │   ├── cron
│   │   │   └── scheduler.ts
│   │   ├── db
│   │   │   ├── repositories
│   │   │   │   ├── evaluationRepo.ts
│   │   │   │   ├── learningMemoryRepo.ts
│   │   │   │   ├── memoryRepo.ts
│   │   │   │   ├── sessionRepo.ts
│   │   │   │   └── userRepo.ts
│   │   │   ├── client.ts
│   │   │   └── fallback-store.ts
│   │   ├── e2e
│   │   │   └── playwright-db.ts
│   │   ├── email
│   │   │   └── client.ts
│   │   ├── epreuves
│   │   │   ├── exam-blanc-generator.ts
│   │   │   ├── fallback-store.ts
│   │   │   ├── report-pdf.tsx
│   │   │   ├── repository.ts
│   │   │   ├── types.ts
│   │   │   └── worker.ts
│   │   ├── evaluation
│   │   │   └── langue.ts
│   │   ├── gamification
│   │   │   └── badges.ts
│   │   ├── langue
│   │   │   └── exercise-bank.ts
│   │   ├── llm
│   │   │   ├── adapters
│   │   │   │   ├── gemini.ts
│   │   │   │   ├── mistral.ts
│   │   │   │   ├── ollama.ts
│   │   │   │   └── openai.ts
│   │   │   ├── prompts
│   │   │   │   └── system.ts
│   │   │   ├── skills
│   │   │   │   ├── bibliothecaire.ts
│   │   │   │   ├── coach-ecrit.ts
│   │   │   │   ├── coach-oral.ts
│   │   │   │   ├── correcteur.ts
│   │   │   │   ├── ecrit-baremage.ts
│   │   │   │   ├── ecrit-contraction.ts
│   │   │   │   ├── ecrit-diagnostic.ts
│   │   │   │   ├── ecrit-essai.ts
│   │   │   │   ├── ecrit-langue.ts
│   │   │   │   ├── ecrit-pastiche.ts
│   │   │   │   ├── ecrit-plans.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── langue-generator.ts
│   │   │   │   ├── oral-bilan-officiel.ts
│   │   │   │   ├── oral-coach-explication.ts
│   │   │   │   ├── oral-coach-lecture.ts
│   │   │   │   ├── oral-entretien.ts
│   │   │   │   ├── oral-examinateur-virtuel.ts
│   │   │   │   ├── oral-grammaire-ciblee.ts
│   │   │   │   ├── oral-prep30.ts
│   │   │   │   ├── oral-tirage.ts
│   │   │   │   ├── quiz-maitre.ts
│   │   │   │   ├── revision-carnet-lecture.ts
│   │   │   │   ├── revision-citations-procedes.ts
│   │   │   │   ├── revision-fiches.ts
│   │   │   │   ├── revision-quiz-adaptatif.ts
│   │   │   │   ├── revision-spaced-repetition.ts
│   │   │   │   ├── revision-sr-planner.ts
│   │   │   │   ├── support-produit.ts
│   │   │   │   ├── tuteur-libre.ts
│   │   │   │   └── types.ts
│   │   │   ├── agent-base.ts
│   │   │   ├── context-manager.ts
│   │   │   ├── cost-tracker.ts
│   │   │   ├── embeddings.ts
│   │   │   ├── factory.ts
│   │   │   ├── orchestrator.ts
│   │   │   ├── provider.ts
│   │   │   ├── router.ts
│   │   │   ├── self-reflection.ts
│   │   │   ├── streaming.ts
│   │   │   └── token-estimate.ts
│   │   ├── mcp
│   │   │   ├── client.ts
│   │   │   └── index.ts
│   │   ├── memory
│   │   │   ├── context-builder.ts
│   │   │   ├── profile-loader.ts
│   │   │   ├── scoring.ts
│   │   │   └── store.ts
│   │   ├── monitoring
│   │   │   └── web-vitals.ts
│   │   ├── navigation
│   │   │   └── tuteur-link.ts
│   │   ├── notifications
│   │   │   ├── push.ts
│   │   │   └── templates.ts
│   │   ├── onboarding
│   │   │   └── copy-analysis.ts
│   │   ├── oral
│   │   │   ├── audio-recorder.ts
│   │   │   ├── capabilities.ts
│   │   │   ├── examiner-context.ts
│   │   │   ├── rag-context.ts
│   │   │   ├── remote-audio.ts
│   │   │   ├── repository.ts
│   │   │   ├── scoring.ts
│   │   │   ├── service.ts
│   │   │   ├── state-machine.ts
│   │   │   └── stt-contract.ts
│   │   ├── parent
│   │   │   └── digest.ts
│   │   ├── payments
│   │   │   └── clictopay.ts
│   │   ├── pdf
│   │   │   └── generator.ts
│   │   ├── portfolio
│   │   │   ├── export.ts
│   │   │   └── profil-card-generator.ts
│   │   ├── queue
│   │   │   ├── correction-queue.ts
│   │   │   ├── start-worker.ts
│   │   │   └── worker.ts
│   │   ├── quiz
│   │   │   └── theme-mapping.ts
│   │   ├── rag
│   │   │   ├── ingestion
│   │   │   │   └── pipeline.ts
│   │   │   ├── chunker.ts
│   │   │   ├── citations.ts
│   │   │   ├── external-client.ts
│   │   │   ├── indexer.ts
│   │   │   ├── media-indexer.ts
│   │   │   ├── rerank.ts
│   │   │   ├── search.ts
│   │   │   └── vector-search.ts
│   │   ├── rgpd
│   │   │   └── consent.ts
│   │   ├── security
│   │   │   ├── csrf-client.ts
│   │   │   ├── csrf.ts
│   │   │   ├── file-validator.ts
│   │   │   ├── llm-rate-limiter.ts
│   │   │   ├── rate-limit.ts
│   │   │   └── sanitize.ts
│   │   ├── spaced-repetition
│   │   │   └── sm2.ts
│   │   ├── storage
│   │   │   ├── copies.ts
│   │   │   ├── provider.ts
│   │   │   └── s3-provider.ts
│   │   ├── store
│   │   │   └── premium-store.ts
│   │   ├── stt
│   │   │   ├── browser.ts
│   │   │   └── transcriber.ts
│   │   ├── tts
│   │   │   └── generator.ts
│   │   ├── types
│   │   │   └── premium.ts
│   │   ├── validation
│   │   │   ├── request.ts
│   │   │   └── schemas.ts
│   │   └── logger.ts
│   └── scripts
│       └── generate-activation-codes.ts
├── tests
│   ├── contracts
│   │   ├── bootstrap-roles.mjs
│   │   ├── bootstrap-teacher-copies.mjs
│   │   ├── openapi.auth.yaml
│   │   ├── openapi.public.yaml
│   │   ├── openapi.teacher.allowed.yaml
│   │   ├── openapi.teacher.forbidden.yaml
│   │   ├── run-schemathesis-auth.sh
│   │   ├── run-schemathesis-teacher-rbac.sh
│   │   ├── run-schemathesis.sh
│   │   ├── run-teacher-comment-rbac.sh
│   │   └── run-teacher-export-rbac.sh
│   ├── e2e
│   │   ├── atelier-ecrit.spec.ts
│   │   ├── atelier-oral.spec.ts
│   │   ├── descriptif-carnet.spec.ts
│   │   ├── espace-enseignant.spec.ts
│   │   ├── flows.spec.ts
│   │   ├── inscription-workflow.spec.ts
│   │   ├── mobile.spec.ts
│   │   ├── navigation.spec.ts
│   │   ├── onboarding.spec.ts
│   │   ├── parcours.spec.ts
│   │   ├── payment-flow.spec.ts
│   │   ├── platform.spec.ts
│   │   ├── quiz-adaptatif.spec.ts
│   │   ├── securite.spec.ts
│   │   └── tuteur-chat.spec.ts
│   ├── fixtures
│   │   └── copie-test.png
│   ├── integration
│   │   ├── api
│   │   │   ├── auth.test.ts
│   │   │   ├── enseignant.test.ts
│   │   │   ├── epreuves.test.ts
│   │   │   ├── oral-full-flow.test.ts
│   │   │   ├── oral-route.test.ts
│   │   │   ├── oral.test.ts
│   │   │   ├── parcours.test.ts
│   │   │   ├── quiz.test.ts
│   │   │   ├── rag-route.test.ts
│   │   │   ├── rag.test.ts
│   │   │   ├── tuteur-route.test.ts
│   │   │   └── tuteur.test.ts
│   │   ├── db
│   │   │   ├── copie.test.ts
│   │   │   ├── memory-events.test.ts
│   │   │   ├── oral-session.test.ts
│   │   │   ├── user-repo.test.ts
│   │   │   └── vector-search.test.ts
│   │   ├── external
│   │   │   └── mistral.test.ts
│   │   ├── rag
│   │   │   └── external-rag.prod-guard.test.ts
│   │   ├── oral-session-flow.test.ts
│   │   ├── orchestrator-pipeline.test.ts
│   │   ├── rag-pipeline.test.ts
│   │   └── router-agent.test.ts
│   ├── performance
│   │   └── load-test.yml
│   ├── security
│   │   └── run-zap.sh
│   └── unit
│       ├── agents
│       │   ├── diagnosticien.test.ts
│       │   ├── diction-analyzer.test.ts
│       │   ├── examiner-persona.test.ts
│       │   ├── pastiche.test.ts
│       │   ├── planner.test.ts
│       │   ├── policy-gate-tunisia.test.ts
│       │   ├── policy-gate.test.ts
│       │   ├── rapport-auto.test.ts
│       │   ├── router-agent.test.ts
│       │   ├── shadow-timer.test.ts
│       │   └── student-modeler.test.ts
│       ├── api
│       │   ├── api-copy-hardcoded-next-batch.test.ts
│       │   ├── api-copy-hardcoded-remaining.test.ts
│       │   ├── api-copy-hardcoded-residual.test.ts
│       │   ├── auth-copy.test.ts
│       │   ├── badges-route.test.ts
│       │   ├── billing-routes.test.ts
│       │   ├── carnet-route.test.ts
│       │   ├── class-code-route.test.ts
│       │   ├── clictopay-callback-route.test.ts
│       │   ├── comment-idor.test.ts
│       │   ├── copie-file-route.test.ts
│       │   ├── copie-status-route.test.ts
│       │   ├── copies-remaining-copy.test.ts
│       │   ├── cron-weekly-reports-copy.test.ts
│       │   ├── descriptif-route.test.ts
│       │   ├── epreuves-generate-route.test.ts
│       │   ├── export-csv-route.test.ts
│       │   ├── health-route.test.ts
│       │   ├── langue-generate-route.test.ts
│       │   ├── media-route.test.ts
│       │   ├── memory-timeline-route.test.ts
│       │   ├── oeuvre-choisie-route.test.ts
│       │   ├── oral-capabilities-route.test.ts
│       │   ├── oral-end-jury-copy.test.ts
│       │   ├── oral-interact-entretien.test.ts
│       │   ├── oral-jury-respond-route.test.ts
│       │   ├── oral-prep-passage-copy.test.ts
│       │   ├── oral-session-end-route.test.ts
│       │   ├── oral-start-copy.test.ts
│       │   ├── oral-voice-submit-route.test.ts
│       │   ├── payment-status-copy.test.ts
│       │   ├── rag-health-route.test.ts
│       │   ├── rag-search-route.test.ts
│       │   ├── ressources-file-route.test.ts
│       │   ├── tuteur-message-route.test.ts
│       │   ├── tuteur-voice-copy.test.ts
│       │   ├── upload-copie-route.test.ts
│       │   └── vitals-route.test.ts
│       ├── auth
│       │   ├── password.test.ts
│       │   ├── reset-password-schema.test.ts
│       │   └── session.test.ts
│       ├── billing
│       │   ├── library-gating.test.ts
│       │   ├── plan-catalog-logic.test.ts
│       │   ├── quotas-single-source.test.ts
│       │   └── quotas.test.ts
│       ├── compliance
│       │   └── anti-triche.test.ts
│       ├── components
│       │   ├── chat-tuteur.test.tsx
│       │   ├── countdown.test.tsx
│       │   ├── oral-simulator-source.test.ts
│       │   ├── oral-simulator.test.tsx
│       │   ├── pdf-preview-copy.test.ts
│       │   ├── quiz-player.test.tsx
│       │   ├── rapport-correction.test.tsx
│       │   └── upload-copie.test.tsx
│       ├── config
│       │   └── tunisia.test.ts
│       ├── copy
│       │   └── fr-catalog.test.ts
│       ├── correction
│       │   ├── annotation-mapper.test.ts
│       │   ├── correcteur.test.ts
│       │   ├── ocr.test.ts
│       │   ├── report-generator.test.ts
│       │   ├── rubrique.test.ts
│       │   └── worker.test.ts
│       ├── data
│       │   ├── media-catalog.test.ts
│       │   └── programme-coherence.test.ts
│       ├── db
│       │   └── production-fail-closed.test.ts
│       ├── e2e
│       │   ├── playwright-config.test.ts
│       │   └── playwright-db.test.ts
│       ├── gamification
│       │   └── badges.test.ts
│       ├── hooks
│       │   └── use-dashboard.test.ts
│       ├── langue
│       │   └── exercise-bank.test.ts
│       ├── llm
│       │   ├── skills
│       │   │   ├── coach_ecrit.test.ts
│       │   │   ├── coach_oral.test.ts
│       │   │   ├── correcteur.test.ts
│       │   │   ├── no-urls-in-schemas.test.ts
│       │   │   ├── quiz_maitre.test.ts
│       │   │   └── tuteur_libre.test.ts
│       │   ├── agent-base.test.ts
│       │   ├── cost-tracker.test.ts
│       │   ├── guardrail-integration.test.ts
│       │   ├── guardrails.test.ts
│       │   ├── mistral-router.test.ts
│       │   ├── no-url-guardrail.test.ts
│       │   ├── orchestrator.test.ts
│       │   ├── provider-factory.test.ts
│       │   ├── rate-limiter.test.ts
│       │   └── token-estimate.test.ts
│       ├── memory
│       │   ├── context-builder.test.ts
│       │   ├── scoring.test.ts
│       │   ├── streak.test.ts
│       │   └── weak-signals.test.ts
│       ├── navigation
│       │   ├── public-header-copy.test.ts
│       │   ├── sidebar-copy.test.ts
│       │   └── sidebar.test.ts
│       ├── notifications
│       │   ├── routes.test.ts
│       │   └── templates.test.ts
│       ├── onboarding
│       │   └── copy-analysis.test.ts
│       ├── oral
│       │   ├── audio-recorder.test.ts
│       │   ├── capabilities.test.ts
│       │   ├── chrono.test.ts
│       │   ├── entretien-oeuvre.test.ts
│       │   ├── evaluator.test.ts
│       │   ├── examiner-persona-integration.test.ts
│       │   ├── extraits.test.ts
│       │   ├── rag-context.test.ts
│       │   ├── remote-audio.test.ts
│       │   ├── scoring.test.ts
│       │   ├── session.test.ts
│       │   └── state-machine.test.ts
│       ├── pages
│       │   ├── home-copy.test.ts
│       │   ├── landing-footer-copy.test.ts
│       │   ├── landing-legacy-copy.test.ts
│       │   ├── legal-copy.test.ts
│       │   ├── library-dashboard-copy.test.ts
│       │   ├── loading.test.ts
│       │   ├── login-copy.test.ts
│       │   ├── onboarding-copy.test.ts
│       │   ├── oral-pages-copy.test.ts
│       │   ├── parent-copy.test.ts
│       │   ├── path-copy.test.ts
│       │   ├── payment-copy.test.ts
│       │   ├── pricing-copy.test.ts
│       │   ├── profile-copy.test.ts
│       │   ├── public-footer-copy.test.ts
│       │   ├── study-pages-copy.test.ts
│       │   ├── teacher-copy.test.ts
│       │   └── tuteur-copy.test.ts
│       ├── parcours
│       │   └── recommender.test.ts
│       ├── parent
│       │   └── digest.test.ts
│       ├── pdf
│       │   └── generator.test.ts
│       ├── portfolio
│       │   └── export.test.ts
│       ├── queue
│       │   └── correction-queue.test.ts
│       ├── quiz
│       │   └── adaptive.test.ts
│       ├── rag
│       │   ├── chunker.test.ts
│       │   ├── external-client.test.ts
│       │   ├── golden-queries.test.ts
│       │   ├── hybrid-search.test.ts
│       │   ├── indexer.test.ts
│       │   ├── ingestion-pipeline.test.ts
│       │   ├── rerank.test.ts
│       │   ├── rrf-fusion.test.ts
│       │   └── vector-search.test.ts
│       ├── rgpd
│       │   └── consent.test.ts
│       ├── scripts
│       │   ├── check-env-script.test.ts
│       │   ├── check-fr-copy.test.ts
│       │   └── deploy-script.test.ts
│       ├── security
│       │   ├── clictopay-hmac.test.ts
│       │   ├── csrf.test.ts
│       │   ├── file-validator.test.ts
│       │   ├── prompt-injection.test.ts
│       │   ├── rate-limit.test.ts
│       │   ├── rbac.test.ts
│       │   └── sanitize.test.ts
│       ├── skills
│       │   └── agent-schemas.test.ts
│       ├── spaced-repetition
│       │   └── sm2.test.ts
│       ├── store
│       │   └── premium-store.test.ts
│       ├── validation
│       │   ├── new-schemas.test.ts
│       │   └── request.test.ts
│       ├── badges.test.ts
│       ├── correcteur.test.ts
│       ├── cost-tracker-v2.test.ts
│       ├── langue-evaluation.test.ts
│       ├── mcp-client.test.ts
│       ├── mistral-ocr.test.ts
│       ├── mistral-router-v2.test.ts
│       ├── oral-session.test.ts
│       ├── orchestrator.test.ts
│       ├── payments
│       ├── policy-gate-tunisia.test.ts
│       ├── rag-search.test.ts
│       ├── rappel-agent-mcp.test.ts
│       ├── spaced-repetition.test.ts
│       ├── upload-copie.test.ts
│       └── vector-search.test.ts
├── .dockerignore
├── .env.example
├── .gitignore
├── .windsurfrules
├── Dockerfile
├── README.md
├── eaf.code-workspace
├── ecosystem.config.cjs
├── eslint.config.mjs
├── knip.json
├── middleware.ts
├── next-env.d.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── playwright.config.ts
├── postcss.config.mjs
├── proxy.ts
├── stryker.conf.json
├── tsconfig.json
├── tsconfig.test.json
└── vitest.config.ts
```
