# Database Schema — Nexus Réussite EAF

> Documentation complète du schéma de données Prisma

---

## 📊 Vue d'ensemble

- **ORM**: Prisma 6
- **Database**: PostgreSQL 16 avec extension pgvector
- **Migrations**: 19 fichiers dans `/prisma/migrations/`
- **Modèles**: 40+ tables
- **Enums**: 20+ types énumérés

---

## 🔐 Authentification & Utilisateurs

### `User`
Table principale des comptes utilisateurs.

| Champ | Type | Description |
|-------|------|-------------|
| `id` | String (PK) | UUID unique |
| `email` | String (unique) | Email de connexion |
| `passwordHash` | String | Hash bcrypt |
| `passwordSalt` | String | Salt bcrypt |
| `role` | UserRole | `eleve`, `enseignant`, `parent`, `admin` |
| `createdAt` | DateTime | Date de création |
| `updatedAt` | DateTime | Date de mise à jour |

**Relations:**
- `profile` → `StudentProfile` (1:1)
- `sessions` → `Session[]` (1:N)
- `subscription` → `Subscription` (1:1)
- `payments` → `PaymentTransaction[]` (1:N)
- `memoryEvents` → `MemoryEvent[]` (1:N)
- `oralSessions` → `OralSession[]` (1:N)

---

### `Session`
Sessions actives (authentification server-side).

| Champ | Type | Description |
|-------|------|-------------|
| `token` | String (PK) | Token de session unique |
| `userId` | String (FK) | Référence User |
| `createdAt` | DateTime | Date création session |
| `expiresAt` | DateTime | Date expiration |
| `lastSeenAt` | DateTime | Dernière activité |

**Indexes:** `userId`, `expiresAt`

---

### `StudentProfile`
Profil détaillé des élèves (50+ champs).

| Champ | Type | Description | Défaut |
|-------|------|-------------|--------|
| `id` | String (PK) | UUID | - |
| `userId` | String (FK, unique) | Référence User | - |
| `displayName` | String | Nom affiché | - |
| `classLevel` | String | Niveau scolaire | - |
| `targetScore` | String | Objectif (ex: "14/20") | - |
| `establishment` | String? | Établissement | null |
| `eafDate` | DateTime? | Date EAF | null |
| `onboardingCompleted` | Boolean | Onboarding fini | `false` |
| `selectedOeuvres` | String[] | Œuvres choisies | `[]` |
| `classCode` | String? | Code classe | null |
| `parcoursProgress` | String[] | Progression | `[]` |
| `badges` | String[] | Badges obtenus | `[]` |
| `xp` | Int | Points expérience | `0` |
| `level` | Int | Niveau | `1` |
| `xpToNextLevel` | Int | XP pour niveau suivant | `100` |
| `preferredObjects` | String[] | Objets d'étude préférés | `[]` |
| `weakSkills` | String[] | Points faibles | `[]` |
| `oeuvreChoisieEntretien` | String? | Œuvre d'entretien | null |
| `skillMap` | Json? | Carte compétences | null |
| `streak` | Int | Série jours consécutifs | `0` |
| `maxStreak` | Int | Série max | `0` |

**Champs ADDENDUM:**

| Champ | Type | Description | Défaut |
|-------|------|-------------|--------|
| `voie` | Voie | `GENERALE`, `TECHNOLOGIQUE` | `GENERALE` |
| `anneeScolaire` | String | Année (ex: "2025-2026") | `"2025-2026"` |
| `targetExamDate` | DateTime? | Date cible examen | null |
| `weeklyGoalMinutes` | Int | Objectif hebdo (min) | `120` |
| `prefWorkingHours` | Json? | Horaires préférés | null |
| `accessibilityNeeds` | Json? | Besoins accessibilité | null |
| `personaPreference` | ExamPersona | `NEUTRE`, `BIENVEILLANT`, `HOSTILE` | `NEUTRE` |
| `globalLevel` | SkillLevel | Niveau global | `INSUFFISANT` |
| `globalLevelUpdatedAt` | DateTime? | Dernière mise à jour | null |

**RGPD Parental Consent:**

| Champ | Type | Description | Défaut |
|-------|------|-------------|--------|
| `parentEmail` | String? | Email parent | null |
| `parentConsentToken` | String? (unique) | Token consentement | null |
| `parentConsentStatus` | String | `pending`, `granted`, `refused`, `withdrawn` | `"pending"` |
| `parentConsentDate` | DateTime? | Date consentement | null |
| `parentConsentIpHash` | String? | Hash IP (audit) | null |

**Relations:**
- `user` → `User` (1:1)
- `skillMapEntries` → `SkillMapEntry[]` (1:N)
- `weakSkillEntries` → `WeakSkillEntry[]` (1:N)
- `workMasteries` → `WorkMastery[]` (1:N)
- `memorySummaries` → `MemorySummary[]` (1:N)
- `studyPlans` → `StudyPlanSnapshot[]` (1:N)
- `diagnosticResults` → `DiagnosticSnapshot[]` (1:N)
- `weeklyReports` → `WeeklyReportSnapshot[]` (1:N)
- `documentDeposits` → `DocumentDeposit[]` (1:N)
- `agentInteractions` → `AgentInteraction[]` (1:N)
- `descriptifTextes` → `DescriptifTexte[]` (1:N)
- `carnetEntries` → `CarnetEntry[]` (1:N)

---

### `PasswordResetToken`
Tokens de réinitialisation mot de passe.

| Champ | Type | Description |
|-------|------|-------------|
| `id` | String (PK) | UUID |
| `userId` | String (FK) | Référence User |
| `tokenHash` | String (unique) | Hash du token |
| `expiresAt` | DateTime | Expiration (24h) |
| `usedAt` | DateTime? | Date d'utilisation |
| `createdAt` | DateTime | Date création |

---

## 💳 Facturation

### `Subscription`
Abonnement actif par utilisateur.

| Champ | Type | Description | Défaut |
|-------|------|-------------|--------|
| `id` | String (PK) | UUID | - |
| `userId` | String (FK, unique) | Référence User | - |
| `externalCustomerId` | String? | ID externe (Stripe, etc.) | null |
| `externalContractId` | String? | ID contrat externe | null |
| `plan` | SubscriptionPlan | Valeurs internes legacy possibles : `FREE`, `PREMIUM`, `PRO`, `MAX` | `FREE` |
| `status` | SubscriptionStatus | `ACTIVE`, `PAST_DUE`, `CANCELED`, etc. | `ACTIVE` |
| `currentPeriodStart` | DateTime? | Début période | null |
| `currentPeriodEnd` | DateTime? | Fin période | null |
| `cancelAtPeriodEnd` | Boolean | Annulation prévue | `false` |
| `trialEnd` | DateTime? | Fin essai | null |
| `createdAt` | DateTime | Date création | now |
| `updatedAt` | DateTime | Date maj | @updatedAt |

**Indexes:** `plan`, `status`

---

### `PaymentTransaction`
Historique des paiements.

| Champ | Type | Description |
|-------|------|-------------|
| `id` | String (PK) | UUID |
| `userId` | String (FK) | Référence User |
| `provider` | PaymentProvider | `CLICTOPAY`, `MANUAL` |
| `status` | PaymentStatus | `PENDING`, `ACCEPTED`, `REFUSED`, `ERROR` |
| `plan` | SubscriptionPlan | Plan concerné |
| `amountMillimes` | Int | Montant en millimes (1 TND = 1000) |
| `currency` | String | Devise (défaut: "TND") |
| `orderRef` | String (unique) | Référence commande |
| `providerRef` | String? | Référence provider |
| `callbackPayload` | Json? | Payload callback |
| `initiatedAt` | DateTime | Date initiation |
| `completedAt` | DateTime? | Date completion |
| `createdAt` | DateTime | Date création |
| `updatedAt` | DateTime | Date maj |

**Indexes:** `userId`, `createdAt`, `provider`, `status`

---

### `ActivationCode`
Codes d'activation pour plans payants.

| Champ | Type | Description | Défaut |
|-------|------|-------------|--------|
| `id` | String (PK) | CUID | - |
| `codeHash` | String (unique) | Hash SHA-256 du code | - |
| `plan` | String | Valeurs techniques historiques : `PREMIUM`, `PRO`, `MAX` | - |
| `durationDays` | Int | Durée en jours | - |
| `status` | String | `CREATED`, `DELIVERED`, `REDEEMED`, `REVOKED` | `"CREATED"` |
| `expiresAt` | DateTime? | Date expiration | null |
| `createdAt` | DateTime | Date création | now |
| `redeemedAt` | DateTime? | Date activation | null |
| `redeemedByUserId` | String? (FK) | Utilisateur qui a activé | null |
| `batchId` | String? | ID lot | null |
| `orderRef` | String? | Référence commande | null |
| `notes` | String? | Notes | null |

**Relations:**
- `redeemedByUser` → `User` (N:1)

**Indexes:** `status`, `batchId`

---

### `UsageCounter`
Suivi des quotas par feature.

| Champ | Type | Description |
|-------|------|-------------|
| `id` | String (PK) | UUID |
| `userId` | String (FK) | Référence User |
| `feature` | String | Code feature (ex: "ORAL_SESSIONS") |
| `periodKey` | String | Clé période (ex: "2026-W12") |
| `count` | Int | Compteur | `0` |
| `createdAt` | DateTime | Date création |
| `updatedAt` | DateTime | Date maj |

**Unique:** `userId`, `feature`, `periodKey`  
**Indexes:** `periodKey`, `feature`

---

## 🎤 Atelier Oral

### `OralSession`
Session complète d'oral (préparation + passage).

| Champ | Type | Description | Défaut |
|-------|------|-------------|--------|
| `id` | String (PK) | UUID | - |
| `userId` | String (FK) | Référence User | - |
| `status` | OralSessionStatus | `DRAFT`, `PREP_RUNNING`, `PREP_ENDED`, `PASSAGE_RUNNING`, `PASSAGE_DONE`, `FINALIZED`, `ABANDONED` | `DRAFT` |
| `mode` | OralMode | `SIMULATION`, `FREE_PRACTICE` | `SIMULATION` |
| `personaType` | ExamPersona | `NEUTRE`, `BIENVEILLANT`, `HOSTILE`, `RANDOM` | `NEUTRE` |
| `anneeScolaire` | String | Année scolaire | `"2025-2026"` |
| `oeuvre` | String | Œuvre tirée | - |
| `extrait` | String | Texte de l'extrait | - |
| `question` | String | Question posée | - |
| `draw` | Json? | Tirage complet | null |
| `transcript` | String? | Transcription | null |
| `score` | Float? | Score calculé | null |
| `maxScore` | Float? | Score max | null |
| `totalScore` | Int? | Note /20 | null |
| `feedback` | Json? | Feedback global | null |
| `pdfUrl` | String? | URL rapport PDF | null |
| `prepStartedAt` | DateTime? | Début préparation | null |
| `prepEndedAt` | DateTime? | Fin préparation | null |
| `passageStartedAt` | DateTime? | Début passage | null |
| `passageEndedAt` | DateTime? | Fin passage | null |
| `phaseTimestamps` | Json? | Timestamps par phase | null |
| `endedAt` | DateTime? | Fin session | null |
| `createdAt` | DateTime | Date création | now |

**Relations:**
- `user` → `User` (N:1)
- `phaseScores` → `OralPhaseScore[]` (1:N)
- `oralTranscript` → `OralTranscript` (1:1)
- `oralBilan` → `OralBilan` (1:1)

**Indexes:** `userId`, `createdAt`, `status`, `anneeScolaire`

---

### `OralPhaseScore`
Score détaillé par phase de l'oral.

| Champ | Type | Description | Défaut |
|-------|------|-------------|--------|
| `id` | String (PK) | UUID | - |
| `sessionId` | String (FK) | Référence OralSession | - |
| `phase` | OralPhase | `LECTURE`, `EXPLICATION`, `GRAMMAIRE`, `ENTRETIEN` | - |
| `score` | Float | Score obtenu | - |
| `maxScore` | Float | Score max | - |
| `aiScore` | Float? | Score brut IA | null |
| `transcript` | String? | Transcription phase | null |
| `feedback` | String? | Feedback phase | null |
| `pointsForts` | String[] | Points forts | `[]` |
| `axes` | String[] | Axes amélioration | `[]` |
| `criteria` | Json? | Critères détaillés | null |
| `citations` | Json? | Citations utilisées | null |
| `duration` | Int | Durée (secondes) | `0` |
| `createdAt` | DateTime | Date création | now |

**Unique:** `sessionId`, `phase`  
**Indexes:** `sessionId`

---

### `OralTranscript`
Transcription complète d'une session.

| Champ | Type | Description |
|-------|------|-------------|
| `id` | String (PK) | UUID |
| `sessionId` | String (FK, unique) | Référence OralSession |
| `fullText` | String | Texte complet |
| `byPhase` | Json? | Texte par phase |
| `audioUrl` | String? | URL audio (si enregistré) |
| `createdAt` | DateTime | Date création |

---

### `OralBilan`
Bilan final avec note et feedback.

| Champ | Type | Description | Défaut |
|-------|------|-------------|--------|
| `id` | String (PK) | UUID | - |
| `sessionId` | String (FK, unique) | Référence OralSession | - |
| `note` | Float | Note /20 | - |
| `mention` | String | Mention (Passable, Bien, etc.) | - |
| `bilanGlobal` | String | Commentaire global | - |
| `conseilFinal` | String | Conseil final | - |
| `axesProgres` | String[] | Axes progression | `[]` |
| `planRevision` | Json? | Plan de révision généré | null |
| `citations` | Json? | Citations identifiées | null |
| `createdAt` | DateTime | Date création | now |

---

## ✍️ Atelier Écrit

### `EpreuveBlanche`
Sujet d'épreuve généré.

| Champ | Type | Description |
|-------|------|-------------|
| `id` | String (PK) | UUID |
| `userId` | String (FK) | Référence User |
| `type` | String | Type d'épreuve |
| `sujet` | String | Sujet proposé |
| `texte` | String | Texte support |
| `consignes` | String | Consignes détaillées |
| `bareme` | Json | Barème de notation |
| `generatedAt` | DateTime | Date génération |
| `createdAt` | DateTime | Date création |

**Relations:**
- `user` → `User` (N:1)
- `copies` → `CopieDeposee[]` (1:N)

---

### `CopieDeposee`
Copie déposée par un élève.

| Champ | Type | Description | Défaut |
|-------|------|-------------|--------|
| `id` | String (PK) | UUID | - |
| `epreuveId` | String (FK) | Référence EpreuveBlanche | - |
| `userId` | String (FK) | Référence User | - |
| `filePath` | String | Chemin fichier | - |
| `fileType` | String | Type MIME | - |
| `status` | CopieStatus | `pending`, `processing`, `done`, `error` | `pending` |
| `ocrText` | String? | Texte OCR | null |
| `correction` | Json? | Correction générée | null |
| `createdAt` | DateTime | Date création | now |
| `correctedAt` | DateTime? | Date correction | null |

**Relations:**
- `epreuve` → `EpreuveBlanche` (N:1)
- `user` → `User` (N:1)

**Indexes:** `userId`, `createdAt`, `epreuveId`

---

## 🧠 RAG & IA

### `Chunk`
Segments vectorisés pour RAG.

| Champ | Type | Description |
|-------|------|-------------|
| `id` | String (PK) | UUID |
| `docId` | String | ID document source |
| `sourceTitle` | String | Titre source |
| `sourceUrl` | String | URL source |
| `sourceType` | String | Type (pdf, video, etc.) |
| `content` | String | Contenu texte |
| `embedding` | vector(1024)? | Embedding vectoriel |
| `chunkIndex` | Int | Index dans document |
| `title` | String? | Titre segment |
| `authorityLevel` | String | Niveau autorité (A, B, C, D) |
| `docType` | String? | Type document |
| `legalBasis` | String? | Fondement légal |
| `publishedAt` | DateTime? | Date publication |
| `sectionPath` | String? | Chemin section |
| `page` | Int? | Numéro page |
| `hash` | String? (unique) | Hash contenu |
| `level` | String? | Niveau scolaire |
| `oeuvre` | String? | Oeuvre concernée |
| `parcours` | String? | Parcours |
| `createdAt` | DateTime | Date création |

**Indexes:** `docId`, `sourceType`, `authorityLevel`, `docType`, `level`, `oeuvre`, `oeuvre+parcours`

---

### `LlmCostLog`
Tracking des coûts LLM.

| Champ | Type | Description | Défaut |
|-------|------|-------------|--------|
| `id` | String (PK) | CUID | - |
| `userId` | String? | Référence User | null |
| `skill` | String | Skill utilisé | - |
| `provider` | String | Provider (Mistral, Gemini, etc.) | - |
| `model` | String | Modèle | - |
| `tier` | String | Tier (premium, standard) | - |
| `inputTokens` | Int | Tokens input | `0` |
| `outputTokens` | Int | Tokens output | `0` |
| `costEurCents` | Int | Coût en centimes € | `0` |
| `latencyMs` | Int | Latence (ms) | `0` |
| `success` | Boolean | Succès | `true` |
| `errorCode` | String? | Code erreur | null |
| `contextSize` | Int? | Taille contexte | null |
| `createdAt` | DateTime | Date création | now |

**Indexes:** `userId`, `createdAt`, `provider`, `skill`, `tier`

---

### `LlmBudgetAlert`
Alertes budget LLM.

| Champ | Type | Description |
|-------|------|-------------|
| `id` | String (PK) | CUID |
| `period` | String | Période (ex: "2026-03") |
| `totalEurCents` | Int | Total dépensé |
| `threshold` | Int | Seuil dépassé |
| `alertedAt` | DateTime | Date alerte |

---

## 📈 Suivi & Analytics

### `MemoryEvent`
Événements mémoire (timeline utilisateur).

| Champ | Type | Description |
|-------|------|-------------|
| `id` | String (PK) | UUID |
| `userId` | String (FK) | Référence User |
| `type` | String | Type événement |
| `feature` | String | Feature concernée |
| `path` | String? | Chemin/URL |
| `payload` | Json? | Données additionnelles |
| `createdAt` | DateTime | Date création |

**Types d'événements:**
- `navigation` — Navigation page
- `interaction` — Interaction UI
- `discussion` — Conversation tuteur
- `resource` — Accès ressource
- `evaluation` — Évaluation complétée
- `quiz` — Quiz complété
- `auth` — Événement auth

**Indexes:** `userId`, `createdAt`, `type`

---

### `Evaluation`
Évaluation manuelle ou automatique.

| Champ | Type | Description |
|-------|------|-------------|
| `id` | String (PK) | UUID |
| `userId` | String (FK) | Référence User |
| `kind` | String | Type évaluation |
| `score` | Float | Score obtenu |
| `maxScore` | Float | Score max |
| `status` | String | Statut |
| `payload` | Json? | Données |
| `evaluatedAt` | DateTime | Date évaluation |
| `createdAt` | DateTime | Date création |

**Indexes:** `userId`, `evaluatedAt`

---

### `ComplianceLog`
Log conformité RGPD.

| Champ | Type | Description |
|-------|------|-------------|
| `id` | String (PK) | CUID |
| `ruleId` | String | ID règle |
| `action` | String | Action effectuée |
| `reason` | String | Raison |
| `skill` | String | Skill concerné |
| `studentId` | String? (FK) | Référence User |
| `metadata` | Json? | Métadonnées |
| `createdAt` | DateTime | Date création |

**Indexes:** `ruleId`, `createdAt`, `studentId`, `createdAt`

---

## 🔔 Notifications

### `PushSubscription`
Abonnements Web Push.

| Champ | Type | Description |
|-------|------|-------------|
| `id` | String (PK) | UUID |
| `userId` | String (FK) | Référence User |
| `endpoint` | String (unique) | URL endpoint |
| `p256dh` | String | Clé publique |
| `auth` | String | Auth secret |
| `createdAt` | DateTime | Date création |

**Indexes:** `userId`

---

## 📚 Ressources pédagogiques

### `OfficialWork`
Œuvres au programme officiel.

| Champ | Type | Description |
|-------|------|-------------|
| `id` | String (PK) | UUID |
| `anneeScolaire` | String | Année (ex: "2025-2026") |
| `oeuvre` | String | Titre de l’œuvre |
| `auteur` | String | Auteur |
| `editeur` | String? | Éditeur |
| `parcours` | String | Parcours |
| `objetEtude` | String | Type (Roman, Poésie, Théâtre) |
| `voie` | String | `generale` ou `technologique` |
| `urlEduscol` | String? | Lien Eduscol |
| `urlBO` | String? | Lien Bulletin Officiel |
| `createdAt` | DateTime | Date création |

**Unique:** `anneeScolaire`, `oeuvre`  
**Indexes:** `anneeScolaire`, `objetEtude`

---

## 📊 Modèles ADDENDUM (Memory System)

### `SkillMapEntry`
Cartographie des compétences détaillée.

| Champ | Type | Description | Défaut |
|-------|------|-------------|--------|
| `id` | String (PK) | UUID | - |
| `profileId` | String (FK) | Référence StudentProfile | - |
| `microSkillKey` | String? | Clé micro-skill | null |
| `skill` | EafSkill | Compétence EAF | - |
| `score` | Float | Score 0-1 | `0.0` |
| `confidence` | Float | Confiance 0-1 | `0.0` |
| `trend` | SkillTrend | `IMPROVING`, `STABLE`, `DECLINING` | `STABLE` |
| `observationCount` | Int | Nb observations | `0` |
| `srNextReview` | DateTime? | Prochaine révision SR | null |
| `srInterval` | Int | Intervalle SR | `1` |
| `srEaseFactor` | Float | Ease factor SR | `2.5` |
| `srRepetitions` | Int | Répétitions SR | `0` |
| `lastObservedAt` | DateTime? | Dernière observation | null |

**Unique:** `profileId`, `skill` | `profileId`, `microSkillKey`

---

### `WeakSkillEntry`
Points faibles identifiés.

| Champ | Type | Description | Défaut |
|-------|------|-------------|--------|
| `id` | String (PK) | UUID | - |
| `profileId` | String (FK) | Référence StudentProfile | - |
| `microSkillKey` | String? | Clé micro-skill | null |
| `skill` | EafSkill | Compétence | - |
| `pattern` | String | Pattern identifié | - |
| `category` | String | Catégorie | - |
| `examples` | Json | Exemples | `[]` |
| `embedding` | vector(1536)? | Embedding | null |
| `frequency` | Int | Fréquence | `1` |
| `severity` | WeakSeverity | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` | `LOW` |
| `decayedScore` | Float | Score décroissant | `1.0` |
| `status` | WeakStatus | `ACTIVE`, `IMPROVING`, `RESOLVED`, `DISMISSED` | `ACTIVE` |
| `firstDetectedAt` | DateTime | Date détection | now |
| `lastOccurrence` | DateTime | Dernière occurrence | now |
| `resolvedAt` | DateTime? | Date résolution | null |
| `sourceInteractionId` | String? | Source | null |
| `sourceAgent` | String? | Agent source | null |

**Indexes:** `profileId`, `status`, `severity`

**Relations:**
- `revisions` → `WeakSkillRevision[]` (1:N)

---

### `WeakSkillRevision`
Révisions des points faibles.

| Champ | Type | Description |
|-------|------|-------------|
| `id` | String (PK) | UUID |
| `weakSkillEntryId` | String (FK) | Référence WeakSkillEntry |
| `phase` | RevisionPhase | `J2`, `J7`, `J21` |
| `success` | Boolean | Succès révision |
| `notes` | String? | Notes |
| `createdAt` | DateTime | Date création |

**Indexes:** `weakSkillEntryId`, `createdAt`

---

### `WorkMastery`
Maîtrise des œuvres.

| Champ | Type | Description | Défaut |
|-------|------|-------------|--------|
| `id` | String (PK) | UUID | - |
| `profileId` | String (FK) | Référence StudentProfile | - |
| `workId` | String | ID œuvre | - |
| `masteryLevel` | Float | Niveau maîtrise 0-1 | `0.0` |
| `srNextReview` | DateTime | Prochaine révision | now |
| `srInterval` | Int | Intervalle SR | `1` |
| `srEaseFactor` | Float | Ease factor | `2.5` |
| `srRepetitions` | Int | Répétitions | `0` |
| `strongThemes` | Json | Thèmes maîtrisés | `[]` |
| `weakThemes` | Json | Thèmes à travailler | `[]` |
| `citationsKnown` | Json | Citations connues | `[]` |
| `sessionsCount` | Int | Nb sessions | `0` |
| `lastSessionAt` | DateTime? | Dernière session | null |

**Unique:** `profileId`, `workId`

---

### `MemorySummary`
Résumés mémoire générés.

| Champ | Type | Description |
|-------|------|-------------|
| `id` | String (PK) | UUID |
| `profileId` | String (FK) | Référence StudentProfile |
| `summaryType` | SummaryType | `FULL`, `ORAL`, `ECRIT`, `RECENT_SESSIONS`, `WEAK_SKILLS` |
| `content` | String | Contenu résumé |
| `tokenCount` | Int | Nombre tokens |
| `embedding` | vector(1536)? | Embedding |
| `generatedAt` | DateTime | Date génération |
| `validUntil` | DateTime | Valide jusqu'à |
| `version` | Int | Version | `1` |

**Unique:** `profileId`, `summaryType`

---

### `StudyPlanSnapshot`
Plan d'étude personnalisé.

| Champ | Type | Description |
|-------|------|-------------|
| `id` | String (PK) | UUID |
| `profileId` | String (FK) | Référence StudentProfile |
| `payload` | Json | Contenu plan |
| `createdAt` | DateTime | Date création |
| `updatedAt` | DateTime | Date maj |

**Unique:** `profileId`

---

### `DiagnosticSnapshot`
Résultats diagnostic.

| Champ | Type | Description |
|-------|------|-------------|
| `id` | String (PK) | UUID |
| `profileId` | String (FK) | Référence StudentProfile |
| `payload` | Json | Résultats |
| `completedAt` | DateTime | Date completion |
| `createdAt` | DateTime | Date création |

**Indexes:** `profileId`, `completedAt`

---

### `WeeklyReportSnapshot`
Rapports hebdomadaires.

| Champ | Type | Description |
|-------|------|-------------|
| `id` | String (PK) | UUID |
| `profileId` | String (FK) | Référence StudentProfile |
| `weekLabel` | String | Libellé semaine |
| `payload` | Json | Contenu rapport |
| `generatedAt` | DateTime | Date génération |
| `createdAt` | DateTime | Date création |

**Indexes:** `profileId`, `generatedAt`

---

### `DocumentDeposit`
Documents déposés par élèves.

| Champ | Type | Description | Défaut |
|-------|------|-------------|--------|
| `id` | String (PK) | UUID | - |
| `profileId` | String (FK) | Référence StudentProfile | - |
| `filename` | String | Nom fichier | - |
| `fileType` | String | Type MIME | - |
| `fileSize` | Int | Taille (bytes) | - |
| `storageUrl` | String | URL stockage | - |
| `storageKey` | String | Clé stockage | - |
| `ocrText` | String? | Texte OCR | null |
| `analysisResult` | Json? | Résultat analyse | null |
| `analysisStatus` | DocStatus | `DOC_PENDING`, `DOC_PROCESSING`, `DOC_DONE`, `DOC_ERROR` | `DOC_PENDING` |
| `linkedSessionId` | String? | Session liée | null |
| `workId` | String? | Oeuvre liée | null |
| `depositType` | DocType | `COPIE_ECRIT`, `ENREGISTREMENT_ORAL`, `RESSOURCE`, `AUTRE` | - |
| `createdAt` | DateTime | Date création | now |
| `expiresAt` | DateTime? | Date expiration | null |

---

### `AgentInteraction`
Interactions avec agents IA.

| Champ | Type | Description | Défaut |
|-------|------|-------------|--------|
| `id` | String (PK) | UUID | - |
| `profileId` | String (FK) | Référence StudentProfile | - |
| `sessionId` | String? | Session liée | null |
| `agentType` | AgentTypeEnum | Type agent | - |
| `inputSummary` | String | Résumé input | - |
| `outputSummary` | String | Résumé output | - |
| `feedbackScore` | Float? | Score feedback | null |
| `feedbackLabel` | String? | Label feedback | null |
| `tokensUsed` | Int | Tokens utilisés | - |
| `latencyMs` | Int | Latence | - |
| `ragSourcesCount` | Int | Sources RAG | `0` |
| `createdAt` | DateTime | Date création | now |

**Indexes:** `profileId`, `createdAt`, `agentType`

---

### `DescriptifTexte`
Textes descriptifs générés.

| Champ | Type | Description |
|-------|------|-------------|
| `id` | String (PK) | UUID |
| `studentId` | String (FK) | Référence StudentProfile |
| `objetEtude` | String | Objet d'étude |
| `oeuvre` | String | Oeuvre |
| `auteur` | String | Auteur |
| `typeExtrait` | String | Type extrait |
| `titre` | String | Titre |
| `premieresLignes` | String? | Début du texte |
| `createdAt` | DateTime | Date création |

**Indexes:** `studentId`, `objetEtude`

---

### `CarnetEntry`
Entrées carnet de lecture.

| Champ | Type | Description | Défaut |
|-------|------|-------------|--------|
| `id` | String (PK) | UUID | - |
| `studentId` | String (FK) | Référence StudentProfile | - |
| `oeuvre` | String | Oeuvre | - |
| `auteur` | String | Auteur | - |
| `type` | String | Type d'entrée | - |
| `contenu` | String | Contenu | - |
| `page` | String? | Page référence | null |
| `tags` | String[] | Tags | `[]` |
| `createdAt` | DateTime | Date création | now |

**Indexes:** `studentId`, `oeuvre`

---

## 📈 Enums

### UserRole
```
eleve
enseignant
parent
admin
```

### SubscriptionPlan
```
FREE
PREMIUM
PRO
MAX
MONTHLY   # legacy
LIFETIME  # legacy
```

### SubscriptionStatus
```
ACTIVE
PAST_DUE
CANCELED
TRIALING
PAUSED
```

### PaymentProvider
```
CLICTOPAY
MANUAL
```

### PaymentStatus
```
PENDING
ACCEPTED
REFUSED
ERROR
```

### OralSessionStatus
```
DRAFT
PREP_RUNNING
PREP_ENDED
PASSAGE_RUNNING
PASSAGE_DONE
FINALIZED
ABANDONED
```

### OralMode
```
SIMULATION
FREE_PRACTICE
```

### OralPhase
```
LECTURE
EXPLICATION
GRAMMAIRE
ENTRETIEN
```

### ExamPersona
```
BIENVEILLANT
NEUTRE
HOSTILE
RANDOM
```

### Voie
```
GENERALE
TECHNOLOGIQUE
```

### SkillLevel
```
INSUFFISANT
PASSABLE
SATISFAISANT
EXCELLENT
```

### SkillTrend
```
IMPROVING
STABLE
DECLINING
```

### WeakSeverity
```
LOW
MEDIUM
HIGH
CRITICAL
```

### WeakStatus
```
ACTIVE
IMPROVING
RESOLVED
DISMISSED
```

### RevisionPhase
```
J2
J7
J21
```

### SummaryType
```
FULL
ORAL
ECRIT
RECENT_SESSIONS
WEAK_SKILLS
```

### DocStatus
```
DOC_PENDING
DOC_PROCESSING
DOC_DONE
DOC_ERROR
```

### DocType
```
COPIE_ECRIT
ENREGISTREMENT_ORAL
RESSOURCE
AUTRE
```

### AgentTypeEnum
```
TIRAGE_ORAL
SHADOW_PREP
COACH_LECTURE
COACH_EXPLICATION
GRAMMAIRE_CIBLEE
ENTRETIEN_OEUVRE
BILAN_ORAL
DIAGNOSTIC_ECRIT
PASTICHE
QUIZ_ADAPTATIF
EXAMINATEUR_VIRTUEL
TUTEUR_LIBRE
BIBLIOTHECAIRE
COACH_ECRIT
CORRECTEUR
QUIZ_MAITRE
ECRIT_LANGUE
SUPPORT_PRODUIT
```

### EafSkill (excerpt)
Compétences EAF détaillées:
```
ORAL_LECTURE_FLUIDITE
ORAL_LECTURE_EXPRESSIVITE
ORAL_EXPLIC_MOUVEMENT
ORAL_EXPLIC_ANALYSE
ORAL_EXPLIC_CITATIONS
ORAL_EXPLIC_OUVERTURE
ORAL_GRAMM_IDENTIFICATION
ORAL_GRAMM_ANALYSE
ORAL_ENTRETIEN_CONNAISSANCE
ORAL_ENTRETIEN_REACTIVITE
ECRIT_COMMENT_PLAN
ECRIT_COMMENT_ANALYSE
ECRIT_DISSERT_THESE
ECRIT_DISSERT_TRANSITION
TRANS_LANGUE_GRAMMAIRE
TRANS_LANGUE_STYLE
TRANS_TEMPS_GESTION
```

---

## 🔗 Relations principales

```
User 1:1 ────── StudentProfile
  │
  ├─ 1:N ───── Session[]
  ├─ 1:1 ────── Subscription
  ├─ 1:N ────── OralSession[]
  ├─ 1:N ────── PaymentTransaction[]
  ├─ 1:N ────── MemoryEvent[]
  ├─ 1:N ────── EpreuveBlanche[]
  └─ 1:N ────── CopieDeposee[]

StudentProfile 1:1 ─ User
  │
  ├─ 1:N ────── SkillMapEntry[]
  ├─ 1:N ────── WeakSkillEntry[]
  ├─ 1:N ────── WorkMastery[]
  ├─ 1:N ────── MemorySummary[]
  ├─ 1:N ────── StudyPlanSnapshot[]
  ├─ 1:N ────── DiagnosticSnapshot[]
  ├─ 1:N ────── WeeklyReportSnapshot[]
  ├─ 1:N ────── DocumentDeposit[]
  └─ 1:N ────── AgentInteraction[]

OralSession 1:1 ───── User
  │
  ├─ 1:N ────── OralPhaseScore[]
  ├─ 1:1 ────── OralTranscript
  └─ 1:1 ────── OralBilan

EpreuveBlanche 1:1 ─── User
  │
  └─ 1:N ────── CopieDeposee[]

CopieDeposee 1:1 ──── User
CopieDeposee 1:1 ──── EpreuveBlanche
```

---

## 📊 Indexes stratégiques

### Performance critiques

| Table | Index | Usage |
|-------|-------|-------|
| `Session` | `userId`, `expiresAt` | Recherche sessions actives |
| `MemoryEvent` | `userId`, `createdAt` | Timeline utilisateur |
| `UsageCounter` | `userId`, `feature`, `periodKey` | Vérification quotas |
| `OralSession` | `userId`, `createdAt` | Historique oral |
| `CopieDeposee` | `userId`, `createdAt` | Historique copies |
| `PaymentTransaction` | `userId`, `createdAt` | Historique paiements |
| `ActivationCode` | `codeHash` | Recherche code |
| `Chunk` | `oeuvre`, `parcours` | Recherche RAG |
| `LlmCostLog` | `userId`, `createdAt` | Tracking coûts |

---

## 🔄 Migrations

| Fichier | Description |
|---------|-------------|
| `0001_initial` | Schéma initial |
| `0002_add_session` | Table Session |
| ... | ... |
| `0018_add_manual_payment_provider` | Provider MANUAL |
| `0019_add_parent_consent_fields` | RGPD consentement parental |

---

<p align="center">
  <a href="./COMPLETE_GUIDE.md">← Retour au guide complet</a>
</p>
