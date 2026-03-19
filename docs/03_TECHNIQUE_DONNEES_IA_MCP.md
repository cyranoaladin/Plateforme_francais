# Référence technique — données, architecture interne, IA, RAG et MCP

Dernière consolidation documentaire : 14 mars 2026

Ce document décrit la structure technique interne du projet : stack, persistance, modules `src/lib`, modèle Prisma, billing, sécurité, orchestrateur LLM, RAG, stockage, worker et serveur MCP.

## 1. Stack technique réelle

Le projet principal utilise :

- Next.js `16.1.6`
- React `19.2.3`
- TypeScript `5`
- Prisma `6.16.2`
- PostgreSQL
- Redis via `ioredis`
- BullMQ
- Zod
- Vitest
- Playwright
- Tailwind CSS 4
- Recharts
- Lucide React
- React Markdown
- `@react-pdf/renderer`
- Resend
- web-push
- node-cron

### Providers IA et audio présents

Le dépôt référence :

- Mistral
- Gemini
- OpenAI
- Ollama
- un endpoint STT Mistral configuré côté variables d’environnement
- un endpoint TTS configurable

## 2. Organisation technique du dépôt

### `src/app`

Contient :

- les pages App Router
- les layouts et pages d’erreur/chargement
- les routes API `v1`

### `src/components`

Contient les composants UI, la navigation, les composants métier et les shells applicatifs.

### `src/lib`

Cœur métier du projet. Sous-dossiers principaux :

- `agents`
- `api`
- `auth`
- `billing`
- `carnet`
- `compliance`
- `config`
- `copy`
- `correction`
- `cron`
- `db`
- `email`
- `epreuves`
- `evaluation`
- `gamification`
- `langue`
- `llm`
- `mcp`
- `memory`
- `monitoring`
- `navigation`
- `notifications`
- `onboarding`
- `oral`
- `parent`
- `payments`
- `pdf`
- `portfolio`
- `queue`
- `quiz`
- `rag`
- `rgpd`
- `security`
- `spaced-repetition`
- `storage`
- `store`
- `stt`
- `tts`
- `types`
- `validation`

### `packages/mcp-server`

Workspace dédié au serveur MCP utilisé par les agents et certaines intégrations techniques.

## 3. Persistance et modèle de données

Le schéma de vérité est `prisma/schema.prisma`.

### Chiffres vérifiés

- `37` modèles Prisma
- `21` enums Prisma

### Enums Prisma présentes

- `UserRole`
- `CopieStatus`
- `SubscriptionPlan`
- `SubscriptionStatus`
- `PaymentProvider`
- `PaymentStatus`
- `OralSessionStatus`
- `OralMode`
- `Voie`
- `SkillLevel`
- `ExamPersona`
- `SkillTrend`
- `EafSkill`
- `WeakSeverity`
- `WeakStatus`
- `RevisionPhase`
- `SummaryType`
- `DocStatus`
- `DocType`
- `AgentTypeEnum`
- `OralPhase`

### Modèles Prisma présents

- `User`
- `Session`
- `MemoryEvent`
- `StudentProfile`
- `Evaluation`
- `EpreuveBlanche`
- `CopieDeposee`
- `OralSession`
- `OralPhaseScore`
- `OralTranscript`
- `OralBilan`
- `OfficialWork`
- `Chunk`
- `LlmCostLog`
- `LlmBudgetAlert`
- `Subscription`
- `UsageCounter`
- `PaymentTransaction`
- `ActivationCode`
- `ErrorBankItem`
- `ComplianceLog`
- `PushSubscription`
- `SkillMapEntry`
- `WeakSkillEntry`
- `WeakSkillRevision`
- `WorkMastery`
- `MemorySummary`
- `StudyPlanSnapshot`
- `DiagnosticSnapshot`
- `WeeklyReportSnapshot`
- `DocumentDeposit`
- `AgentInteraction`
- `DescriptifTexte`
- `WebVital`
- `CarnetEntry`
- `PasswordResetToken`
- un modèle complémentaire documentaire/annexe issu de la fin du schéma selon l’état du dépôt courant

### Entités centrales du produit

#### `User`

Compte principal avec :

- email
- hash/salt mot de passe
- rôle
- relation vers profil, sessions, évaluations, paiements, usages et journaux techniques

#### `StudentProfile`

Centre pédagogique du projet. Porte notamment :

- identité affichée
- classe
- date d’EAF
- œuvres choisies
- weak skills
- badges
- XP et niveau
- streak
- préférences et métadonnées de travail
- skill map et dérivés
- relations vers plans, diagnostics, rapports, dépôt documentaire, interactions agentiques, descriptif et carnet

#### `Evaluation`

Historique des évaluations, avec score, max score, payload et date.

#### `EpreuveBlanche` et `CopieDeposee`

Modélisent l’écrit : sujet, consignes, barème, copie déposée, OCR, correction et statuts.

#### `OralSession`, `OralPhaseScore`, `OralTranscript`, `OralBilan`

Sous-système oral complet : session, scoring par phase, transcription, bilan final.

#### `Subscription`, `UsageCounter`, `PaymentTransaction`, `ActivationCode`

Sous-système commercial : plan, statut, compteurs d’usage, transactions, activation de codes.

#### `Chunk`

Base documentaire indexée utilisée par le RAG.

## 4. Base de données et modes de fonctionnement

### Base principale

Le provider Prisma est `postgresql`.

Variables structurantes :

- `DATABASE_URL`
- `DIRECT_URL`

### Fallback local

Le dépôt contient `src/lib/db/fallback-store.ts`, utilisé comme mécanisme de repli dans certains scénarios dégradés ou de développement.

### pgvector et recherche vectorielle

Le projet supporte la recherche vectorielle locale à travers :

- `Chunk`
- `src/lib/rag/vector-search.ts`
- l’indexation et l’ingestion RAG

## 5. Redis, quotas et file d’attente

Redis intervient dans plusieurs responsabilités :

- rate limiting HTTP
- quotas d’usage
- limitations LLM
- gestion de queue de correction
- certaines métriques ou états techniques

Variable clé :

- `REDIS_URL`

### Queue et worker

Les fichiers principaux sont :

- `src/lib/queue/correction-queue.ts`
- `src/lib/queue/worker.ts`
- `src/lib/queue/start-worker.ts`

Le déploiement PM2 inclut un process `eaf-worker` dédié.

## 6. Billing, plans et quotas

Le moteur billing est organisé dans `src/lib/billing`.

### Fichiers majeurs

- `context.ts`
- `copy.ts`
- `gating.ts`
- `library-gating.ts`
- `plan-catalog.ts`
- `quotas.ts`
- `redeem.ts`
- `usage.ts`

### Responsabilités

- normalisation du plan actif
- lecture du contexte d’abonnement
- application des règles de gating
- consommation et lecture des quotas
- activation de codes
- intégration avec les routes API billing et paiement

### Plans observables dans le code

Le code gère explicitement :

- `FREE`
- `PREMIUM`
- `PRO`
- des alias historiques comme `MONTHLY` et `LIFETIME`
- un plan additionnel normalisé côté moteur selon les zones fonctionnelles

## 7. Paiements ClicToPay

Le domaine de paiement est porté principalement par :

- `src/lib/payments/clictopay.ts`
- `src/app/api/v1/payments/clictopay/*`

Variables visibles dans le dépôt :

- `CLICTOPAY_API_BASE_URL`
- `CLICTOPAY_CALLBACK_URL`
- `CLICTOPAY_FAILURE_URL`
- `CLICTOPAY_GET_TOKEN`
- `CLICTOPAY_IP_ALLOWLIST`
- `CLICTOPAY_PUBLIC_BASE_URL`
- `CLICTOPAY_SUCCESS_URL`
- `CLICTOPAY_WEBHOOK_SECRET`

## 8. Sous-système oral

Le domaine oral est organisé autour de :

- `src/lib/oral/repository.ts`
- `src/lib/oral/service.ts`
- `src/lib/oral/scoring.ts`
- `src/lib/oral/state-machine.ts`
- `src/lib/oral/capabilities.ts`
- `src/lib/oral/rag-context.ts`
- `src/lib/oral/stt-contract.ts`

### Responsabilités

- création et lecture de session orale
- sélection d’extrait
- logique de phases et statut
- scoring par phase
- bilan global
- enrichissement contextuel
- capacités STT/TTS

### Invariants récents importants

Le backend oral protège désormais explicitement :

- l’absence de débit de quota sur payload invalide
- l’absence de débit de quota sur échec de sélection d’extrait
- la non-fuite d’erreurs internes lors de l’échec de sélection d’extrait
- l’interdiction d’interagir sur session finalisée
- l’interdiction de finaliser une session vide
- l’interdiction de finaliser deux fois une session

## 9. Sous-système écrit et correction

La correction écrite s’appuie principalement sur :

- `src/lib/correction/*`
- `src/lib/epreuves/*`
- `src/lib/storage/copies.ts`
- `src/lib/pdf/generator.ts`

### Responsabilités

- génération d’épreuve
- dépôt de copie
- validation binaire du fichier
- OCR
- correction IA
- génération de rapport
- stockage et restitution des fichiers

## 10. Orchestrateur LLM

Le cœur IA applicatif est `src/lib/llm/orchestrator.ts`.

### Sous-modules LLM présents

- adaptateurs providers
- routeur
- skills
- prompts
- gestion de contexte
- tracking de coûts
- estimation de tokens
- streaming
- self-reflection

### Responsabilités de l’orchestrateur

- sélection du skill métier
- assemblage du contexte
- appel du provider adapté
- validation des sorties structurées
- tracking des coûts
- intégration avec la mémoire
- gestion de garde-fous anti-triche et conformité

## 11. Agents métier

`src/lib/agents` contient les briques métier agentiques suivantes :

- `diagnosticien.ts`
- `planner.ts`
- `policy-gate.ts`
- `rappel-agent.ts`
- `rapport-auto.ts`
- `router.ts`
- `student-modeler.ts`
- `avocat-diable.ts`
- modules diction, pastiche, prompts et shadow timer

### Rôle des agents

- diagnostic initial ou continu
- transformation des interactions en signaux pédagogiques
- planification d’actions
- contrôle de conformité
- synthèse hebdomadaire
- routage vers le bon comportement IA

## 12. RAG

Le domaine RAG est porté par `src/lib/rag`.

### Fichiers majeurs

- `chunker.ts`
- `citations.ts`
- `external-client.ts`
- `indexer.ts`
- `ingestion/pipeline.ts`
- `media-indexer.ts`
- `rerank.ts`
- `search.ts`
- `vector-search.ts`

### Capacités RAG

- indexation documentaire
- découpage en chunks
- recherche hybride
- recherche vectorielle
- reranking
- citations
- fallback entre moteur externe et moteur local

### Variables visibles

- `RAG_API_URL`
- `RAG_API_TOKEN`
- `RAG_TIMEOUT_MS`
- `RAG_TOP_K`
- `RAG_ALPHA`
- `RAG_RERANK`
- `RAG_COLLECTION`
- `RAG_CHUNK_SIZE`
- `RAG_CHUNK_OVERLAP`
- `RAG_EMBEDDING_DIMENSION`
- `RAG_MATIERE`
- `RAG_NIVEAU`

## 13. Sécurité applicative

Le sous-système sécurité est concentré dans `src/lib/security`.

### Fichiers majeurs

- `csrf.ts`
- `csrf-client.ts`
- `file-validator.ts`
- `llm-rate-limiter.ts`
- `rate-limit.ts`
- `sanitize.ts`

### Contrôles principaux

- CSRF sur routes mutantes
- sanitation des entrées utilisateur
- validation des fichiers uploadés par signature binaire
- rate limiting HTTP générique
- rate limiting LLM spécialisé
- protections transversales via headers applicatifs

### Compléments sécurité hors dossier dédié

- headers dans `next.config.ts`
- middleware global
- RBAC enseignant sur certaines routes
- messages utilisateurs centralisés dans `src/lib/copy/fr`
- garde-fous de conformité et anti-triche

## 14. Stockage, fichiers et médias

Le projet supporte :

- stockage local en développement et test
- stockage S3 compatible via variables dédiées

En production, le provider attendu est `s3`.

Fichiers majeurs :

- `src/lib/storage/provider.ts`
- `src/lib/storage/copies.ts`
- `src/lib/storage/s3-provider.ts`

Variables visibles :

- `STORAGE_PROVIDER`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_BUCKET`
- `S3_REGION`
- `S3_ENDPOINT`
- `S3_PUBLIC_URL`
- `MAX_UPLOAD_SIZE_MB`

## 15. Email, notifications et consentement

Le dépôt supporte :

- emails via Resend
- notifications push via VAPID
- gestion de consentement RGPD

Variables visibles :

- `RESEND_API_KEY`
- `EMAIL_FROM`
- `EMAIL_REPLY_TO`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`
- `CONSENT_IP_HASH_SECRET`

## 16. MCP server

Le workspace `packages/mcp-server` contient :

- `src/index.ts`
- `src/server.ts`
- `src/transport-http.ts`
- `src/client.ts`
- `src/lib/*`
- `src/resources/*`
- `src/prompts/*`
- `src/tools/*`
- `src/types/*`

### Nombre réel d’outils exposés

Le serveur MCP expose actuellement `20` outils `eaf_*` dans `packages/mcp-server/src/server.ts`.

### Outils exposés

- `eaf_get_student_profile`
- `eaf_update_skill_map`
- `eaf_get_error_bank`
- `eaf_schedule_revision`
- `eaf_get_study_plan`
- `eaf_search_corpus`
- `eaf_get_chunk`
- `eaf_index_document`
- `eaf_get_correction`
- `eaf_save_evaluation`
- `eaf_get_oral_session`
- `eaf_generate_plan`
- `eaf_mark_task_complete`
- `eaf_get_weekly_stats`
- `eaf_get_skill_delta`
- `eaf_generate_report`
- `eaf_check_policy`
- `eaf_log_rule_event`
- `eaf_get_subscription`
- `eaf_get_usage`

### Responsabilités du serveur MCP

- exposition d’outils typed pour agents
- vérification de scope par type d’agent
- rate limiting par élève
- lecture de ressources statiques
- transport stdio ou HTTP
- journalisation structurée

### Variables MCP visibles

- `MCP_API_KEY`
- `MCP_PORT`
- `MCP_TRANSPORT`
- `MCP_RATE_LIMIT_PER_MINUTE`
- `MCP_SERVER_URL`
- `MCP_ALLOWED_ORIGINS`
- `MCP_HTTP_ALLOWED_SKILLS`
- `MCP_LOG_LEVEL`

## 17. Variables d’environnement applicatives visibles dans le code

Le dépôt référence au moins les catégories de variables suivantes :

### Infrastructure

- `NODE_ENV`
- `PORT`
- `BASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `LOG_LEVEL`
- `LOG_PRETTY`

### Session et sécurité

- `SESSION_SECRET`
- `CSRF_SECRET`
- `CRON_SECRET`
- `COOKIE_SECURE`
- `CONSENT_IP_HASH_SECRET`

### Base et Redis

- `DATABASE_URL`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `REDIS_URL`

### IA et providers

- `LLM_PROVIDER`
- `LLM_PROVIDER_ORDER`
- `LLM_ROUTER_ENABLED`
- `LLM_MULTI_PROVIDER_FALLBACK`
- `LLM_TIMEOUT_MS`
- `LLM_COST_TRACKING`
- `MISTRAL_API_KEY`
- `MISTRAL_BASE_URL`
- `MISTRAL_SMALL_MODEL`
- `MISTRAL_LARGE_MODEL`
- `MISTRAL_REASONING_MODEL`
- `MISTRAL_MICRO_MODEL`
- `MISTRAL_PIXTRAL_MODEL`
- `MISTRAL_OCR_MODEL`
- `MISTRAL_EMBED_MODEL`
- `MISTRAL_DAILY_BUDGET_EUR`
- `MISTRAL_MONTHLY_BUDGET_EUR`
- `MISTRAL_STT_ENDPOINT`
- `GEMINI_API_KEY`
- `OPENAI_API_KEY`
- `OPENAI_STT_MODEL`
- `OLLAMA_BASE_URL`
- `OLLAMA_MODEL`
- `OLLAMA_EMBEDDING_MODEL`
- `OLLAMA_TIMEOUT_MS`
- `TTS_API_URL`
- `TTS_API_KEY`
- `TTS_VOICE_ID`

### Billing et paiement

- `BILLING_CODE_PEPPER`
- `CLICTOPAY_*`

### Stockage

- `STORAGE_PROVIDER`
- `S3_*`

### Email et push

- `RESEND_API_KEY`
- `EMAIL_FROM`
- `EMAIL_REPLY_TO`
- `VAPID_*`

### E2E et dev/test

- `E2E_BASE_URL`
- `E2E_PORT`
- `E2E_DISABLE_RATE_LIMIT`
- `E2E_REUSE_EXISTING_SERVER`
- `E2E_TEST_EMAIL`
- `E2E_TEST_PASSWORD`
- `E2E_USER_EMAIL`
- `E2E_USER_PASSWORD`

## 18. Scripts techniques importants

Le dépôt racine contient notamment :

- `scripts/setup.sh`
- `scripts/seed.ts`
- `scripts/index-rag.ts`
- `scripts/ingest-media-catalog.ts`
- `scripts/check-env.js`
- `scripts/check-fr-copy.ts`
- `scripts/audit-csrf-routes.mjs`
- `scripts/deploy.sh`
- `scripts/test-production-locale.sh`

Ces scripts participent au setup, au seed, à l’indexation, à l’audit ou à l’exploitation locale/serveur.

## 19. Conclusion technique

Le projet repose sur un monolithe Next.js structuré en domaines métier, avec une couche IA importante, une persistance riche, des quotas/billing intégrés, et un serveur MCP séparé pour l’outillage agentique. La compréhension du système passe principalement par la lecture combinée de :

- `src/app`
- `src/lib`
- `prisma/schema.prisma`
- `packages/mcp-server`
- `tests/`
