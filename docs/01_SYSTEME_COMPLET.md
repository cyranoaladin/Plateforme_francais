# Système complet — Nexus Réussite EAF

Dernière consolidation documentaire : 14 mars 2026

Ce document décrit le projet comme un système complet. Il couvre la finalité produit, les rôles, la navigation, les domaines métier, les flux applicatifs et l’organisation fonctionnelle réelle du dépôt. Son objectif est de permettre à une personne qui ne lit pas le code de comprendre ce que fait la plateforme, comment elle est structurée et comment les différentes briques coopèrent.

## 1. Résumé exécutif

Nexus Réussite EAF est une plateforme web de préparation à l’Épreuve anticipée de français. Le projet combine :

- une landing page publique et un parcours commercial
- une authentification avec session cookie et protection CSRF
- un cockpit élève centré sur la progression
- un atelier écrit avec génération de sujet, dépôt de copie, OCR, correction et rapport
- un atelier oral avec session guidée, préparation, passage, grammaire, entretien, STT et TTS
- un atelier langue et un moteur de quiz
- un tuteur IA contextualisé par mémoire et RAG
- un espace enseignant pour le suivi de classe
- une couche billing avec plans, quotas, paiement ClicToPay et codes d’activation
- un serveur MCP dédié aux agents et services internes

La plateforme ne se limite pas à afficher des réponses générées. Elle transforme les interactions en événements pédagogiques persistés, en évaluations, en signaux de progression, en rappels, en tâches et en synthèses exploitables.

## 2. Publics et rôles

Le modèle de données supporte quatre rôles :

- `eleve`
- `enseignant`
- `parent`
- `admin`

### Élève

L’élève est le cœur du produit. Il a accès au parcours complet : onboarding, dashboard, tuteur, ateliers, quiz, bibliothèque, carnet, descriptif, profil, billing et suivi de progression.

### Enseignant

L’enseignant dispose d’un espace dédié pour le code de classe, le dashboard de classe, l’export CSV et les commentaires manuels sur certaines copies.

### Parent

Le rôle parent existe et dispose d’une page dédiée, mais la surface fonctionnelle est plus réduite que celle du cockpit élève.

### Admin

Le rôle admin existe côté modèle, scripts et certains flux techniques. Il n’est pas exposé comme rôle d’inscription publique standard.

## 3. Navigation réelle du produit

Le dépôt contient `23` pages `page.tsx` dans `src/app`.

### Pages publiques et commerciales

- `/`
- `/(public)/landing`
- `/login`
- `/pricing`
- `/mentions-legales`
- `/paiement/confirmation`
- `/paiement/refus`
- `/bienvenue`

### Pages élève

- `/dashboard`
- `/onboarding`
- `/mon-parcours`
- `/profil`
- `/tuteur`
- `/atelier-ecrit`
- `/atelier-ecrit/correction/[copieId]`
- `/atelier-oral`
- `/atelier-langue`
- `/quiz`
- `/bibliotheque`
- `/carnet`
- `/descriptif`

### Pages rôles additionnels

- `/enseignant`
- `/parent`

### Point d’attention important

Le vrai point d’entrée applicatif élève est `/dashboard`. La page `/` reste l’entrée publique/marketing. La documentation doit donc distinguer clairement le site public du cockpit élève authentifié.

## 4. Domaines fonctionnels

### 4.1 Authentification et identité

Le domaine auth couvre :

- inscription
- connexion
- déconnexion
- session utilisateur
- récupération de mot de passe
- réinitialisation de mot de passe
- protection CSRF sur les routes mutantes

La session est persistée dans le modèle `Session`. Le rôle est porté par `User.role`.

### 4.2 Onboarding

L’onboarding collecte et structure les informations de départ :

- nom affiché
- niveau de classe
- score cible
- date d’EAF
- œuvres choisies
- besoins de travail
- code de classe éventuel
- auto-évaluation ou signaux initiaux

Le résultat est persisté dans `StudentProfile` et alimente les premières recommandations, weak skills et suggestions de parcours.

### 4.3 Dashboard et profil

Le cockpit élève agrège :

- profil pédagogique
- niveaux et XP
- streak
- badges
- weak skills
- activité récente
- résultats d’évaluations
- recommandations de travail
- données de progression issues des ateliers

Le dashboard est une vue de synthèse. Le profil est la vue détaillée du modèle élève.

### 4.4 Mon parcours

`/mon-parcours` synthétise le plan de travail et les recommandations. Le moteur associé orchestre :

- génération ou rafraîchissement du plan
- lecture du profil
- lecture des faiblesses
- prise en compte des œuvres choisies
- proposition d’actions ciblées

### 4.5 Tuteur IA

Le tuteur est un agent généraliste centré sur l’aide méthodique. Il s’appuie sur :

- le profil élève
- la mémoire pédagogique
- le RAG
- les règles anti-triche
- les quotas LLM et RAG
- le billing

Il ne doit pas remplacer totalement le travail de l’élève. Il doit rester dans un cadre guidé, explicable et, quand nécessaire, sourcé.

### 4.6 Atelier écrit

Le domaine écrit couvre :

- génération d’épreuve blanche
- dépôt de copie
- validation du fichier
- OCR
- correction IA
- lecture du statut de correction
- accès sécurisé au fichier
- génération de rapport PDF
- enrichissement éventuel du profil et de la progression

Le modèle principal est `EpreuveBlanche`, avec `CopieDeposee` pour les copies et leur statut.

### 4.7 Atelier oral

Le domaine oral est l’un des noyaux métier majeurs. Il couvre :

- démarrage de session orale
- sélection d’extrait
- préparation
- passage
- relances de jury
- interaction par phase
- question de grammaire
- entretien final
- finalisation de session
- bilan sur 20
- transcription audio
- synthèse de session

Le flux s’appuie notamment sur :

- `OralSession`
- `OralPhaseScore`
- `OralTranscript`
- `OralBilan`
- `src/lib/oral/service.ts`
- `src/lib/oral/state-machine.ts`
- `src/lib/oral/scoring.ts`

Le flux a été récemment durci pour empêcher :

- le débit de quota sur requête invalide
- le débit de quota si la sélection d’extrait échoue
- l’interaction après finalisation
- la double finalisation
- la fuite de messages d’erreur internes côté API

### 4.8 Atelier langue

Le domaine langue couvre la génération et l’évaluation d’exercices ciblés. Il produit des retours structurés, persistables sous forme d’évaluation et exploitables par le moteur de progression.

### 4.9 Quiz

Le quiz génère des questions contextualisées, éventuellement enrichies par le RAG et des contenus média. Il alimente les évaluations, la progression et parfois la gamification.

### 4.10 Bibliothèque et ressources

La bibliothèque donne accès à :

- ressources pédagogiques
- œuvres et documents indexés
- contenus média
- recherche documentaire
- recherche augmentée par RAG
- fichiers de ressources contrôlés côté serveur

Le domaine est couplé au billing via des règles de gating.

### 4.11 Carnet de lecture

Le carnet permet à l’élève de stocker des notes structurées par œuvre. Le domaine couvre :

- listing des entrées
- création d’entrée
- suppression d’entrée
- export

Le carnet est lié au profil étudiant via `CarnetEntry`.

### 4.12 Descriptif de lecture

Le descriptif structure les textes préparés par l’élève. Il alimente l’atelier oral et les sélections d’extraits.

### 4.13 Espace enseignant

L’espace enseignant couvre :

- code de classe
- dashboard enseignant
- export CSV
- commentaire manuel sur correction

Le serveur applique un contrôle d’accès enseignant et des règles de portée sur les copies consultables.

### 4.14 Billing, paiements et quotas

Le système billing couvre :

- lecture du statut d’abonnement
- vérification de quota
- gating de fonctionnalités
- compteurs d’usage
- codes d’activation
- paiement ClicToPay
- callbacks et lecture de statut public/privé

Le domaine s’appuie sur :

- `Subscription`
- `UsageCounter`
- `PaymentTransaction`
- `ActivationCode`
- `src/lib/billing/*`
- `src/lib/payments/clictopay.ts`

### 4.15 Notifications, emails et crons

Le projet supporte :

- emails transactionnels
- notifications push web
- rappels de révision
- rapports hebdomadaires
- nettoyage de sessions expirées

## 5. Architecture logique

Le projet est un monolithe Next.js App Router enrichi par un workspace MCP.

### 5.1 Couche interface

Située dans `src/app` et `src/components`.

Responsabilités :

- pages et layouts
- shell applicatif
- composants UI
- formulaires
- navigation
- composants de visualisation

### 5.2 Couche API applicative

Située dans `src/app/api/v1`.

Responsabilités :

- réception HTTP
- auth et CSRF
- validation des requêtes
- contrôle de quotas
- orchestration métier
- sérialisation des réponses
- messages utilisateur via `src/lib/copy/fr`

Le dépôt contient `60` routes API versionnées dans `src/app/api/v1`.

### 5.3 Couche métier dans `src/lib`

C’est le cœur du système. Les sous-domaines majeurs sont :

- `agents`
- `auth`
- `billing`
- `copy`
- `correction`
- `db`
- `epreuves`
- `langue`
- `llm`
- `memory`
- `oral`
- `payments`
- `queue`
- `rag`
- `security`
- `storage`
- `stt`
- `tts`
- `validation`

### 5.4 Couche de persistance

La persistance principale est assurée par Prisma/PostgreSQL.

Des compléments existent :

- Redis pour rate limiting, quotas et files d’attente
- fallback local pour certains usages dégradés
- stockage de fichiers local ou S3

### 5.5 Couche agentique externe/interne

Le workspace `packages/mcp-server` expose un serveur MCP distinct destiné aux agents et intégrations outillées.

## 6. Grands modules techniques

### `src/lib/agents`

Agents métier et orchestrateurs de pilotage pédagogique :

- diagnosticien
- planner
- policy-gate
- rappel-agent
- rapport-auto
- router
- student-modeler
- avocat-diable
- modules spécialisés diction, shadow timer, prompts et pastiche

### `src/lib/llm`

Orchestration IA :

- orchestrateur principal
- routeur de providers
- adaptateurs
- skills
- gestion de contexte
- tracking des coûts
- streaming
- estimation de tokens

### `src/lib/rag`

Recherche documentaire et enrichissement de contexte :

- chunking
- citations
- client RAG externe
- indexation
- ingestion
- rerank
- recherche hybride
- recherche vectorielle

### `src/lib/oral`

Sous-système oral :

- capacités audio
- contexte examinateur
- contexte RAG oral
- repository
- scoring
- service métier
- automate d’état
- contrat STT

### `src/lib/billing`

Sous-système billing :

- contexte d’abonnement
- copy billing
- gating et library gating
- catalogue de plans
- quotas
- activation code
- usage

### `src/lib/db`

Sous-système de persistance :

- client Prisma
- fallback store
- repositories

### `src/lib/security`

Sous-système sécurité :

- CSRF client et serveur
- validation binaire de fichiers
- rate limiting
- rate limiting LLM
- sanitation

## 7. Flux métier critiques

### Flux de tuteur

1. authentification
2. validation CSRF
3. vérification quotas / billing
4. sanitation de l’entrée
5. construction du contexte élève
6. recherche RAG éventuelle
7. orchestration LLM
8. persistance d’événement mémoire
9. réponse structurée

### Flux écrit

1. génération de sujet
2. dépôt de copie
3. validation du fichier
4. OCR
5. correction
6. persistance du résultat
7. consultation de statut / rapport / fichier

### Flux oral

1. démarrage de session
2. validation de la requête
3. sélection d’extrait
4. consommation de quota après validation métier
5. préparation
6. passage et interactions par phase
7. relances de jury si besoin
8. finalisation
9. calcul des scores et bilan

### Flux onboarding → progression

1. collecte des données d’entrée
2. mise à jour du profil
3. génération d’un message et d’un premier plan
4. alimentation du parcours
5. exploitation ultérieure dans tuteur, quiz, oral et écrit

## 8. Réalité documentaire à connaître

La documentation historique du dépôt était volumineuse mais redondante, partiellement contradictoire et parfois obsolète. La présente consolidation remplace cette logique par un noyau documentaire unique.

## 9. Source de vérité documentaire

L’ordre de vérité est désormais :

1. code et configuration du dépôt
2. `README.md`
3. `docs/00_INDEX.md`
4. `docs/01_SYSTEME_COMPLET.md`
5. `docs/02_API_REFERENCE_COMPLETE.md`
6. `docs/03_TECHNIQUE_DONNEES_IA_MCP.md`
7. `docs/04_EXPLOITATION_TESTS_DEPLOIEMENT.md`
8. `docs/05_ARBORESCENCE_COMPLETE.md`

Tout document plus ancien non reconduit dans ce noyau doit être considéré comme remplacé.
