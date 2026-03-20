# 03 - Modeles de Donnees (Prisma + Redis)

> Audit genere le 2026-03-20 | Source : `prisma/schema.prisma`

---

## 1. Vue d'ensemble

| Composant       | Valeur                      |
|-----------------|-----------------------------|
| ORM             | Prisma Client JS            |
| SGBD            | PostgreSQL (+ pgvector)     |
| Cache / Queues  | Redis (ioredis) + BullMQ    |
| Modeles         | 32                          |
| Enums           | 21                          |
| Migrations      | 15                          |

---

## 2. Enums

| Enum                | Valeurs |
|---------------------|---------|
| `UserRole`          | `eleve`, `enseignant`, `parent`, `admin` |
| `CopieStatus`       | `pending`, `processing`, `done`, `error` |
| `SubscriptionPlan`  | `FREE`, `PREMIUM`, `PRO`, `MONTHLY`, `LIFETIME` |
| `SubscriptionStatus`| `ACTIVE`, `PAST_DUE`, `CANCELED`, `TRIALING`, `PAUSED` |
| `PaymentProvider`   | `CLICTOPAY` |
| `PaymentStatus`     | `PENDING`, `ACCEPTED`, `REFUSED`, `ERROR` |
| `OralSessionStatus` | `DRAFT`, `PREP_RUNNING`, `PREP_ENDED`, `PASSAGE_RUNNING`, `PASSAGE_DONE`, `FINALIZED`, `ABANDONED` |
| `OralMode`          | `SIMULATION`, `FREE_PRACTICE` |
| `Voie`              | `GENERALE`, `TECHNOLOGIQUE` |
| `SkillLevel`        | `INSUFFISANT`, `PASSABLE`, `SATISFAISANT`, `EXCELLENT` |
| `ExamPersona`       | `BIENVEILLANT`, `NEUTRE`, `HOSTILE`, `RANDOM` |
| `SkillTrend`        | `IMPROVING`, `STABLE`, `DECLINING` |
| `EafSkill`          | 23 micro-competences (ORAL_LECTURE_*, ORAL_EXPLIC_*, ORAL_GRAMM_*, ORAL_ENTRETIEN_*, ECRIT_COMMENT_*, ECRIT_DISSERT_*, TRANS_*) |
| `WeakSeverity`      | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `WeakStatus`        | `ACTIVE`, `IMPROVING`, `RESOLVED`, `DISMISSED` |
| `RevisionPhase`     | `J2`, `J7`, `J21` |
| `SummaryType`       | `FULL`, `ORAL`, `ECRIT`, `RECENT_SESSIONS`, `WEAK_SKILLS` |
| `DocStatus`         | `DOC_PENDING`, `DOC_PROCESSING`, `DOC_DONE`, `DOC_ERROR` |
| `DocType`           | `COPIE_ECRIT`, `ENREGISTREMENT_ORAL`, `RESSOURCE`, `AUTRE` |
| `AgentTypeEnum`     | 17 agents IA (TIRAGE_ORAL, SHADOW_PREP, COACH_*, GRAMMAIRE_CIBLEE, ENTRETIEN_OEUVRE, BILAN_ORAL, DIAGNOSTIC_ECRIT, PASTICHE, QUIZ_ADAPTATIF, EXAMINATEUR_VIRTUEL, TUTEUR_LIBRE, BIBLIOTHECAIRE, CORRECTEUR, QUIZ_MAITRE, ECRIT_LANGUE, SUPPORT_PRODUIT) |
| `OralPhase`         | `LECTURE`, `EXPLICATION`, `GRAMMAIRE`, `ENTRETIEN` |

---

## 3. Modeles par domaine

### 3.1 Authentification & Identite

#### `User`
- **But** : Compte utilisateur central, cle de voute de toutes les relations.
- **Champs** : `id` (uuid PK), `email` (unique), `passwordHash`, `passwordSalt`, `role` (UserRole, default `eleve`), `createdAt`, `updatedAt`
- **Relations** : `profile` (1:1 StudentProfile), `sessions` (1:N), `memoryEvents` (1:N), `evaluations` (1:N), `epreuves` (1:N), `copies` (1:N), `oralSessions` (1:N), `subscription` (1:1), `payments` (1:N), `usages` (1:N), `pushSubscriptions` (1:N), `complianceLogs` (1:N), `activationCodes` (1:N), `passwordResets` (1:N)
- **Usage** : 17 fichiers (modele le plus reference)

#### `Session`
- **But** : Sessions d'authentification token-based.
- **Champs** : `token` (PK), `userId` (FK), `createdAt`, `expiresAt`, `lastSeenAt`
- **Index** : `userId`, `expiresAt`
- **Usage** : 3 fichiers

#### `PasswordResetToken`
- **But** : Jetons de reinitialisation de mot de passe.
- **Champs** : `id` (uuid PK), `userId` (FK), `tokenHash` (unique), `expiresAt`, `usedAt`, `createdAt`
- **Index** : `userId`, `expiresAt`
- **Usage** : 2 fichiers

---

### 3.2 Profil Etudiant & Gamification

#### `StudentProfile`
- **But** : Profil complet de l'eleve (progres, preferences, niveaux, gamification).
- **Champs cles** : `displayName`, `classLevel`, `targetScore`, `establishment`, `eafDate`, `onboardingCompleted`, `selectedOeuvres[]`, `classCode`, `parcoursProgress[]`, `badges[]`, `xp`, `level`, `xpToNextLevel`, `preferredObjects[]`, `weakSkills[]`, `oeuvreChoisieEntretien`, `skillMap` (Json), `streak`, `maxStreak`, `voie` (Voie), `anneeScolaire`, `targetExamDate`, `weeklyGoalMinutes`, `prefWorkingHours` (Json), `accessibilityNeeds` (Json), `personaPreference` (ExamPersona), `globalLevel` (SkillLevel), `globalLevelUpdatedAt`
- **Relations sortantes** : `skillMapEntries`, `weakSkillEntries`, `workMasteries`, `memorySummaries`, `studyPlans`, `diagnosticResults`, `weeklyReports`, `documentDeposits`, `agentInteractions`, `descriptifTextes`, `carnetEntries`
- **Unique** : `userId`
- **Usage** : 11 fichiers

---

### 3.3 Evaluations & Epreuves Ecrites

#### `Evaluation`
- **But** : Evaluation generique (quiz, exercice, etc.).
- **Champs** : `id`, `userId` (FK), `kind`, `score`, `maxScore`, `status`, `payload` (Json), `evaluatedAt`
- **Index** : `[userId, evaluatedAt]`
- **Usage** : 2 fichiers

#### `EpreuveBlanche`
- **But** : Sujet d'epreuve blanche genere par l'IA.
- **Champs** : `id`, `userId` (FK), `type`, `sujet`, `texte`, `consignes`, `bareme` (Json), `generatedAt`
- **Relations** : `copies` (1:N CopieDeposee)
- **Index** : `[userId, generatedAt]`
- **Usage** : 1 fichier

#### `CopieDeposee`
- **But** : Copie d'eleve soumise pour correction automatique.
- **Champs** : `id`, `epreuveId` (FK), `userId` (FK), `filePath`, `fileType`, `status` (CopieStatus), `ocrText`, `correction` (Json), `correctedAt`
- **Index** : `[userId, createdAt]`, `[epreuveId]`
- **Usage** : 2 fichiers

---

### 3.4 Oral

#### `OralSession`
- **But** : Session d'oral EAF (simulation ou entrainement libre).
- **Champs cles** : `userId`, `status` (OralSessionStatus), `mode` (OralMode), `personaType` (ExamPersona), `anneeScolaire`, `oeuvre`, `extrait`, `question`, `draw` (Json), `transcript`, `score`, `maxScore`, `totalScore` (/20), `feedback` (Json), `pdfUrl`, timestamps de preparation et passage, `phaseTimestamps` (Json)
- **Relations** : `phaseScores` (1:N), `oralTranscript` (1:1), `oralBilan` (1:1)
- **Index** : `[userId, createdAt]`, `[status]`, `[anneeScolaire]`
- **Usage** : 1 fichier (via prisma.oralSession)

#### `OralPhaseScore`
- **But** : Note detaillee par phase d'oral (lecture, explication, grammaire, entretien).
- **Champs** : `sessionId` (FK), `phase` (OralPhase), `score`, `maxScore`, `aiScore`, `transcript` (Text), `feedback` (Text), `pointsForts[]`, `axes[]`, `criteria` (Json), `citations` (Json), `duration`
- **Unique** : `[sessionId, phase]`
- **Usage** : 0 fichier direct (acces via include OralSession)

#### `OralTranscript`
- **But** : Transcription complete d'une session d'oral.
- **Champs** : `sessionId` (unique FK), `fullText` (Text), `byPhase` (Json), `audioUrl`
- **Usage** : 0 fichier direct

#### `OralBilan`
- **But** : Bilan final d'une session d'oral avec note /20 et conseils.
- **Champs** : `sessionId` (unique FK), `note` (/20), `mention`, `bilanGlobal` (Text), `conseilFinal` (Text), `axesProgres[]`, `planRevision` (Json), `citations` (Json)
- **Usage** : 0 fichier direct

---

### 3.5 Memoire Adaptative (Memory Store)

#### `SkillMapEntry`
- **But** : Niveau de competence par micro-skill avec repetition espacee (spaced repetition).
- **Champs** : `profileId` (FK), `microSkillKey`, `skill` (EafSkill), `score`, `confidence`, `trend` (SkillTrend), `observationCount`, `srNextReview`, `srInterval`, `srEaseFactor`, `srRepetitions`, `lastObservedAt`
- **Unique** : `[profileId, skill]`, `[profileId, microSkillKey]`
- **Usage** : 1 fichier

#### `WeakSkillEntry`
- **But** : Points faibles detectes avec embeddings vectoriels pour clustering.
- **Champs** : `profileId` (FK), `microSkillKey`, `skill` (EafSkill), `pattern`, `category`, `examples` (Json), `embedding` (vector 1536), `frequency`, `severity` (WeakSeverity), `decayedScore`, `status` (WeakStatus), `firstDetectedAt`, `lastOccurrence`, `resolvedAt`, `sourceInteractionId`, `sourceAgent`
- **Relations** : `revisions` (1:N WeakSkillRevision)
- **Index** : `[profileId, status]`, `[severity]`
- **Usage** : 2 fichiers

#### `WeakSkillRevision`
- **But** : Suivi des revisions espacees (J2, J7, J21) des points faibles.
- **Champs** : `weakSkillEntryId` (FK), `phase` (RevisionPhase), `success`, `notes`
- **Index** : `[weakSkillEntryId, createdAt]`
- **Usage** : 1 fichier

#### `WorkMastery`
- **But** : Niveau de maitrise par oeuvre au programme, avec spaced repetition.
- **Champs** : `profileId` (FK), `workId`, `masteryLevel`, SR fields, `strongThemes` (Json), `weakThemes` (Json), `citationsKnown` (Json), `sessionsCount`, `lastSessionAt`
- **Unique** : `[profileId, workId]`
- **Usage** : 1 fichier

#### `MemorySummary`
- **But** : Resumes generes par l'IA pour injecter dans le contexte LLM.
- **Champs** : `profileId` (FK), `summaryType` (SummaryType), `content` (Text), `tokenCount`, `embedding` (vector 1536), `generatedAt`, `validUntil`, `version`
- **Unique** : `[profileId, summaryType]`
- **Usage** : 1 fichier

#### `StudyPlanSnapshot`
- **But** : Plan de revision personnalise (snapshot JSON).
- **Champs** : `profileId` (FK, unique), `payload` (Json)
- **Usage** : 1 fichier

#### `DiagnosticSnapshot`
- **But** : Resultat de diagnostic (test de positionnement).
- **Champs** : `profileId` (FK), `payload` (Json), `completedAt`
- **Index** : `[profileId, completedAt]`
- **Usage** : 1 fichier

#### `WeeklyReportSnapshot`
- **But** : Bilan hebdomadaire genere.
- **Champs** : `profileId` (FK), `weekLabel`, `payload` (Json), `generatedAt`
- **Index** : `[profileId, generatedAt]`
- **Usage** : 1 fichier

#### `MemoryEvent`
- **But** : Evenements bruts du parcours utilisateur (analytics internes).
- **Champs** : `userId` (FK), `type`, `feature`, `path`, `payload` (Json)
- **Index** : `[userId, createdAt]`, `[type]`
- **Usage** : 2 fichiers

---

### 3.6 Carnet de Lecture

#### `CarnetEntry`
- **But** : Notes de lecture personnelles de l'eleve.
- **Champs** : `studentId` (FK -> StudentProfile), `oeuvre`, `auteur`, `type`, `contenu`, `page`, `tags[]`
- **Index** : `[studentId, oeuvre]`
- **Usage** : 2 fichiers

#### `DescriptifTexte`
- **But** : Descriptif de texte pour le dossier oral (liste de textes presentes).
- **Champs** : `studentId` (FK -> StudentProfile), `objetEtude`, `oeuvre`, `auteur`, `typeExtrait`, `titre`, `premieresLignes`
- **Index** : `[studentId, objetEtude]`
- **Usage** : 1 fichier

---

### 3.7 Documents & Fichiers

#### `DocumentDeposit`
- **But** : Upload de documents (copies, enregistrements, ressources) avec analyse OCR.
- **Champs** : `profileId` (FK), `filename`, `fileType`, `fileSize`, `storageUrl`, `storageKey`, `ocrText` (Text), `analysisResult` (Json), `analysisStatus` (DocStatus), `linkedSessionId`, `workId`, `depositType` (DocType), `expiresAt`
- **Usage** : 1 fichier

---

### 3.8 Facturation (Billing)

#### `Subscription`
- **But** : Abonnement utilisateur (plan + statut).
- **Champs** : `userId` (unique FK), `externalCustomerId`, `externalContractId`, `plan` (SubscriptionPlan, default FREE), `status` (SubscriptionStatus), `currentPeriodStart`, `currentPeriodEnd`, `cancelAtPeriodEnd`, `trialEnd`
- **Index** : `[plan, status]`
- **Usage** : 5 fichiers

#### `PaymentTransaction`
- **But** : Transaction de paiement ClicToPay.
- **Champs** : `userId` (FK), `provider` (PaymentProvider), `status` (PaymentStatus), `plan` (SubscriptionPlan), `amountMillimes`, `currency` (default "TND"), `orderRef` (unique), `providerRef`, `callbackPayload` (Json), `initiatedAt`, `completedAt`
- **Index** : `[userId, createdAt]`, `[provider, status]`
- **Usage** : 6 fichiers

#### `UsageCounter`
- **But** : Compteur d'utilisation par feature et periode (quotas plan).
- **Champs** : `userId` (FK), `feature`, `periodKey`, `count`
- **Unique** : `[userId, feature, periodKey]`
- **Index** : `[periodKey, feature]`
- **Usage** : 1 fichier

#### `ActivationCode`
- **But** : Codes d'activation prepaid (achat physique).
- **Champs** : `codeHash` (unique), `plan`, `durationDays`, `status` (CREATED/DELIVERED/REDEEMED/REVOKED), `expiresAt`, `redeemedAt`, `redeemedByUserId` (FK), `batchId`, `orderRef`, `notes`
- **Index** : `[status]`, `[batchId]`
- **Usage** : 2 fichiers

---

### 3.9 RAG (Retrieval-Augmented Generation)

#### `Chunk`
- **But** : Fragments de documents indexes avec embeddings vectoriels pour la recherche semantique.
- **Champs** : `docId`, `sourceTitle`, `sourceUrl`, `sourceType`, `content`, `embedding` (vector 1024, pgvector), `chunkIndex`, `title`, `authorityLevel` (default "D"), `docType`, `legalBasis`, `publishedAt`, `sectionPath`, `page`, `hash` (unique), `level`, `oeuvre`, `parcours`
- **Index** : `[docId]`, `[sourceType]`, `[authorityLevel]`, `[docType]`, `[level]`, `[oeuvre]`, `[oeuvre, parcours]`, `[sourceType, authorityLevel]`
- **Usage** : Acces via `$queryRaw` dans `src/lib/rag/vector-search.ts` (recherche vectorielle SQL directe)

#### `OfficialWork`
- **But** : Oeuvres officielles au programme de l'EAF par annee scolaire.
- **Champs** : `anneeScolaire`, `oeuvre`, `auteur`, `editeur`, `parcours`, `objetEtude`, `voie`, `urlEduscol`, `urlBO`
- **Unique** : `[anneeScolaire, oeuvre]`
- **Index** : `[anneeScolaire]`, `[objetEtude]`
- **Usage** : 0 fichier direct (probablement seed data ou MCP)

---

### 3.10 Agents IA & Interactions

#### `AgentInteraction`
- **But** : Log de chaque interaction avec un agent IA (metriques, feedback).
- **Champs** : `profileId` (FK), `sessionId`, `agentType` (AgentTypeEnum), `inputSummary`, `outputSummary`, `feedbackScore`, `feedbackLabel`, `tokensUsed`, `latencyMs`, `ragSourcesCount`
- **Index** : `[profileId, createdAt]`, `[agentType]`
- **Usage** : 1 fichier

---

### 3.11 Observabilite & Conformite

#### `LlmCostLog`
- **But** : Suivi des couts LLM par appel (tokens, latence, cout en EUR cents).
- **Champs** : `userId`, `skill`, `provider`, `model`, `tier`, `inputTokens`, `outputTokens`, `costEurCents`, `latencyMs`, `success`, `errorCode`, `contextSize`
- **Index** : `[userId, createdAt]`, `[provider, createdAt]`, `[skill, createdAt]`, `[tier, createdAt]`
- **Usage** : 1 fichier (`src/lib/llm/cost-tracker.ts`, acces via `$queryRaw` pour les aggregations)

#### `LlmBudgetAlert`
- **But** : Alertes de depassement de budget LLM.
- **Champs** : `period`, `totalEurCents`, `threshold`, `alertedAt`
- **Usage** : 0 fichier direct (probablement cree via cost-tracker)

#### `ComplianceLog`
- **But** : Log de conformite (regles appliquees, actions prises).
- **Champs** : `ruleId`, `action`, `reason`, `skill`, `studentId` (FK optional), `metadata` (Json)
- **Index** : `[ruleId, createdAt]`, `[studentId, createdAt]`
- **Usage** : 0 fichier direct

#### `WebVital`
- **But** : Metriques de performance web (Core Web Vitals).
- **Champs** : `name` (LCP/FID/CLS/TTFB/INP), `value`, `rating`, `navigationType`, `userAgent`
- **Index** : `[name, createdAt]`
- **Usage** : 1 fichier

---

### 3.12 Notifications

#### `PushSubscription`
- **But** : Abonnements push (Web Push API).
- **Champs** : `userId` (FK), `endpoint` (unique), `p256dh`, `auth`
- **Index** : `[userId]`
- **Usage** : 0 fichier direct

---

### 3.13 Erreurs de l'Eleve

#### `ErrorBankItem`
- **But** : Banque d'erreurs recurrentes avec revision espacee.
- **Champs** : `studentId`, `errorType`, `errorContext` (Text), `correction` (Text), `severity`, `sourceInteractionId`, `nextRevision`, `revisionCount`, `archivedAt`
- **Index** : `[studentId, nextRevision]`, `[studentId, archivedAt]`
- **Usage** : 0 fichier direct (probablement prevu mais pas encore integre)

---

## 4. Diagramme de relations (simplifie)

```
User (1) ──── (1) StudentProfile
  |                    |
  |                    +──── (N) SkillMapEntry
  |                    +──── (N) WeakSkillEntry ──── (N) WeakSkillRevision
  |                    +──── (N) WorkMastery
  |                    +──── (N) MemorySummary
  |                    +──── (1) StudyPlanSnapshot
  |                    +──── (N) DiagnosticSnapshot
  |                    +──── (N) WeeklyReportSnapshot
  |                    +──── (N) DocumentDeposit
  |                    +──── (N) AgentInteraction
  |                    +──── (N) DescriptifTexte
  |                    +──── (N) CarnetEntry
  |
  +──── (N) Session
  +──── (N) MemoryEvent
  +──── (N) Evaluation
  +──── (N) EpreuveBlanche ──── (N) CopieDeposee
  +──── (N) OralSession ──── (N) OralPhaseScore
  |                     ──── (1) OralTranscript
  |                     ──── (1) OralBilan
  +──── (1) Subscription
  +──── (N) PaymentTransaction
  +──── (N) UsageCounter
  +──── (N) PushSubscription
  +──── (N) ComplianceLog
  +──── (N) ActivationCode
  +──── (N) PasswordResetToken

Standalone:
  Chunk (RAG vectoriel, pgvector)
  OfficialWork (referentiel oeuvres)
  LlmCostLog (observabilite)
  LlmBudgetAlert (alertes budget)
  ErrorBankItem (banque erreurs, FK implicite par studentId string)
  WebVital (metriques front)
```

---

## 5. Migrations Prisma

| #    | Nom                                     | Description probable |
|------|-----------------------------------------|----------------------|
| 0001 | `init`                                  | Schema initial (User, Session, Evaluation) |
| 0002 | `student_profile_onboarding`            | Ajout StudentProfile avec onboarding |
| 0003 | `profile_badges`                        | Badges et gamification |
| 0004 | `rag_columns_and_missing_models`        | Colonnes RAG (Chunk) et modeles manquants |
| 0005 | `oral_eaf_conformity`                   | OralSession conforme a l'EAF |
| 0006 | `oral_v2_schema`                        | OralPhaseScore, OralTranscript, OralBilan |
| 0007 | `billing_plans_v2`                      | Plans de facturation v2 |
| 0008 | `addendum_memory_store_v1`              | Memory store (SkillMapEntry, WeakSkillEntry, WorkMastery, etc.) |
| 0009 | `gamification_xp_columns`              | Colonnes XP/level/streak |
| 0009 | `oral_oeuvre_choisie`                   | Champ oeuvreChoisieEntretien (note : doublon de numero) |
| 0010 | `descriptif_lecture`                    | DescriptifTexte |
| 0011 | `carnet_lecture`                        | CarnetEntry |
| 0012 | `pgvector_hnsw_index`                   | Index HNSW pour recherche vectorielle |
| 0013 | `premium_history_and_learning_memory`   | Historique premium + memoire d'apprentissage |
| 0014 | `add_billing_tables`                    | PaymentTransaction, ActivationCode |
| 0015 | `add_web_vital_table`                   | WebVital |

> Note : Deux migrations portent le numero 0009 (gamification_xp_columns et oral_oeuvre_choisie). Prisma tolere cela car il trie par nom complet du dossier.

---

## 6. Redis : cles et patterns

Redis est utilise pour 4 cas d'usage distincts :

### 6.1 Rate Limiting (IP-based)

| Fichier | Pattern de cle | TTL | Strategie |
|---------|---------------|-----|-----------|
| `src/lib/security/rate-limit.ts` | `rl:{routeKey}:{ip}` | 60s (configurable) | FAIL-CLOSED en prod, in-memory fallback en dev |

Commandes : `INCR`, `EXPIRE`, `TTL`, `PING`

### 6.2 LLM Quota (par utilisateur et skill)

| Fichier | Pattern de cle | TTL | Strategie |
|---------|---------------|-----|-----------|
| `src/lib/security/llm-rate-limiter.ts` | `llm_quota:{userId}:{skill}:daily:{YYYY-MM-DD}` | 86400s | FAIL-CLOSED |
| `src/lib/security/llm-rate-limiter.ts` | `llm_quota:{userId}:{skill}:rpm:{YYYY-MM-DDTHH:MM}` | 60s | FAIL-CLOSED |

Skills limitees : `tuteur_libre` (20 rpm/200 daily), `correcteur` (5/50), `coach_oral` (10/100), `quiz_maitre` (30/300), `coach_ecrit` (5/50). Default : 15 rpm / 150 daily.

### 6.3 Billing Quota (par utilisateur et entitlement)

| Fichier | Pattern de cle | TTL | Strategie |
|---------|---------------|-----|-----------|
| `src/lib/billing/usage.ts` | `quota:{userId}:{entitlementKey}:{periodKey}` | 86400-2678400s (day/week/month) | FAIL-CLOSED en prod, allow en dev |

Commandes : `INCRBY`, `DECRBY` (rollback), `EXPIRE`, `GET`, `PING`

### 6.4 BullMQ Correction Queue

| Fichier | Pattern de cle | TTL | Description |
|---------|---------------|-----|-------------|
| `src/lib/queue/correction-queue.ts` | `bull:correction-jobs:wait` | -- | File d'attente BullMQ |
| `src/lib/queue/correction-queue.ts` | `bull:correction-jobs:active` | -- | Jobs en cours |

Queue config : 3 tentatives, backoff exponentiel (2s), retention 50 succes / 100 echecs. Circuit breaker avec cooldown 10s.

### 6.5 MCP Server (cache generique)

| Fichier | Pattern de cle | TTL | Description |
|---------|---------------|-----|-------------|
| `packages/mcp-server/src/lib/redis.ts` | Generique via `cacheGet`/`cacheSet` | configurable | Cache JSON avec `SETEX` |
| `packages/mcp-server/src/lib/redis.ts` | `bull:{queueName}:wait/active` | -- | Monitoring des queues |

---

## 7. Modeles non utilises dans le code

Les modeles suivants sont declares dans le schema mais ont 0 reference directe dans `src/` :

| Modele | Observation |
|--------|-------------|
| `OfficialWork` | Probablement alimente via seed ou script externe |
| `OralPhaseScore` | Acces uniquement via `include` dans les queries OralSession |
| `OralTranscript` | Idem (relation 1:1 avec OralSession) |
| `OralBilan` | Idem |
| `ErrorBankItem` | Schema present, code non implemente (FK implicite sans relation Prisma) |
| `ComplianceLog` | Schema present, pas d'ecriture trouvee |
| `PushSubscription` | Schema present, pas d'envoi push implemente |
| `LlmBudgetAlert` | Probablement cree via le cost-tracker mais non reference directement |

---

## 8. Observations et risques

1. **ErrorBankItem** utilise un `studentId` string sans relation Prisma (pas de FK constraint en DB). Risque d'orphelins.
2. **Deux migrations 0009** : numerotation dupliquee, pas bloquant mais source de confusion.
3. **Chunk embedding** utilise `vector(1024)` tandis que **WeakSkillEntry/MemorySummary** utilisent `vector(1536)` -- deux dimensions d'embedding coexistent (modeles differents).
4. **PushSubscription, ComplianceLog, ErrorBankItem** : schemas declares mais non utilises dans le code -- dead code potentiel ou fonctionnalites non encore implementees.
5. **Redis FAIL-CLOSED** : en production, si Redis tombe, toutes les requetes API protegees (rate limit) et les appels LLM (quota) sont refuses. Risque de denial-of-service auto-inflige.
6. **OfficialWork** n'a aucune relation avec d'autres modeles (pas de FK vers Chunk ou OralSession via `workId`). Les liens sont implicites par chaines de caracteres (`oeuvre`, `workId`).
