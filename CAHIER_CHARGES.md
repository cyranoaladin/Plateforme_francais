1) Liste d’issues GitHub (P0 / P1 / P2)

Convention de labels (suggestion) : priority:P0|P1|P2, area:oral|rag|auth|billing|security|ui|infra, type:bug|feature|refactor|docs|test.

P0 — Bloquants produit (conformité EAF + cohérence SaaS)
Issue P0-1 — Oral EAF : barème officiel + structure phases (2/8/2/8)

Type: bug/refactor — Area: oral

Problème: le module oral n’est pas strictement aligné sur la structure officielle (lecture 2, explication 8, grammaire 2, entretien 8) et doit être conforme “mot à mot” sur la structure et les points.

Critères d’acceptation

Les 4 composantes existent dans le modèle, dans l’UI, dans le JSON de bilan, dans le PDF.

La note /20 est exactement lecture/2 + explication/8 + grammaire/2 + entretien/8.

Toute trace de 6/8/6 ou d’omission de grammaire disparaît.

Fichiers impactés (probables)

src/lib/oral/service.ts

src/app/api/v1/oral/session/start/route.ts

UI oral (pages/components)

Tests à ajouter

Unit : computeOralScore() sur cas nominaux + bords (0, max, valeurs invalides)

API : start → submit phases → finalize renvoie /20 conforme

Snapshot PDF (au moins vérif présence des 4 sections et totaux)

Issue P0-2 — Oral EAF : minuterie “30 min préparation / 20 min passage”

Type: feature — Area: oral/ui

Critères d’acceptation

Un écran “Préparation” avec timer 30:00, puis “Passage” 20:00.

Les timestamps de début/fin sont persistés (DB) pour relecture.

Pause/reprise contrôlée (ex : autoriser 1 pause max, audit log).

Fichiers impactés

src/lib/oral/*

UI oral + API

prisma/schema.prisma (si ajout champs)

Tests

Unit : transitions d’état (PREP → PASSAGE → DONE)

E2E : session complète chronométrée (fake timers)

Issue P0-3 — “Un seul utilisateur : élève” (suppression rôles/espaces non-élève)

Type: refactor — Area: auth/ui

Critères d’acceptation

Il n’existe qu’un seul flux d’inscription et un seul dashboard.

Aucun rôle “teacher/admin” requis pour accéder à des features.

Les guards/RBAC deviennent des checks simples “authenticated student”.

Fichiers impactés

src/lib/auth/*, middlewares, guards

toutes pages/menus conditionnels

prisma/schema.prisma (Role/UserType si présent)

Tests

Unit : accès pages protégées (logged out → redirect, logged in → OK)

E2E : signup → onboarding → dashboard

Issue P0-4 — RAG : branchement “bibliothèque massive” (ingestion + recherche fiable + citations)

Type: feature/refactor — Area: rag

Critères d’acceptation

Un pipeline ingestion supporte “centaines de docs” (PDF/HTML/docx) avec chunking + métadonnées (source, date, type, œuvre/parcours, niveau).

Recherche hybride (vector + lexical) + rerank léger.

Les réponses agents citent au moins 1–3 sources (lien + extrait court) lorsque pertinent.

Fichiers impactés

src/lib/rag/*

tables Chunk/index (pgvector)

job d’ingestion (script/route admin “internal”)

Tests

Unit : chunker (taille, overlap, métadonnées)

Integration : ingestion → search renvoie top-k cohérents

Non-régression : recherche sur corpus “mini fixture”

Issue P0-5 — Nettoyage “références officielles” + sources institutionnelles directes

Type: bug/docs — Area: rag/content

Critères d’acceptation

Suppression de tout contenu “démo” / non pédagogique.

Les sources “officielles” pointent sur des documents/BO/Eduscol précis, pas sur des homepages.

Ajout d’une table/collection “OfficialDocs” versionnée par année scolaire.

Fichiers impactés

src/data/references.ts + ingestion

Tests

Lint : aucune URL blacklistée

Unit : validateReferences()

Issue P0-6 — Anti-triche (no “copie complète”) généralisé à toutes les sorties “production”

Type: security/feature — Area: llm

Critères d’acceptation

Un garde-fou unique protège tous les endpoints génératifs (écrit/oral/quiz/tuteur).

Détection : “rédige le devoir complet”, “fais l’oral entier”, etc → refus + guidance.

Traces : log “refusal_reason”.

Fichiers impactés

src/lib/llm/orchestrator.ts + routes

Tests

Unit : classification demandes interdites (jeu de prompts)

API : endpoint renvoie 4xx + message pédagogique

Issue P0-7 — CSP production (retirer unsafe-eval, stratégie nonce) + durcissement XSS

Type: security — Area: security

Critères d’acceptation

CSP sans unsafe-eval en prod, nonces/hashes pour scripts inline si nécessaires.

Rapport de compatibilité (pages qui cassent → corrigées).

Fichiers impactés

next.config.ts, layout, scripts

Tests

E2E : pages principales rendent OK

Security regression : headers snapshot

Issue P0-8 — .env.example + onboarding dev “1 commande”

Type: docs/infra

Critères d’acceptation

.env.example présent, README aligné, pnpm dev fonctionne.

Vérif au CI : si variable obligatoire manquante → erreur explicite.

Fichiers

README.md, .env.example, scripts

Tests

CI job “config sanity”

P1 — Qualité premium SaaS (abonnement, quotas, auto-support, robustesse)
Issue P1-1 — Billing/abonnement : plans, quotas, paywall (sans accompagnement humain)

Type: feature — Area: billing

Critères d’acceptation

Plans (Free/Pro/Max) avec quotas : OCR/mois, tokens LLM/jour, sessions orales/semaine, épreuves écrites/mois.

UI : page “Abonnement”, “Usage”, “Renouvellement”.

Paywall “soft” (warning) puis “hard” (blocage).

Fichiers

routes billing, DB plan/usage, UI settings

Tests

Unit : computeUsage(), enforceQuota()

Integration : simulate over-quota → blocage

Issue P1-2 — Observabilité : métriques LLM/RAG/OCR + alerting

Type: infra — Area: infra

Critères

Traces par requête : provider, latence, coût estimé, top-k sources RAG, erreurs OCR.

Dashboard minimal (table admin interne) ou logs structurés.

Tests

Unit : logger schema Zod

Integration : log emitted on calls

Issue P1-3 — Jobs : bascule réelle BullMQ/Redis (plus de “in-process” par défaut)

Type: refactor — Area: queue

Critères

Upload copie → job queue systématique si Redis up, fallback local seulement en dev.

Retry/backoff, dead-letter.

Tests

Integration : job processed, retry path

Issue P1-4 — “Self-serve help” (support 100% agentique)

Type: feature — Area: ui/agent

Critères

Centre d’aide intégré : FAQ + agent “Support Produit” (diagnostic, facturation, bugs).

Génération automatique d’un “rapport de diagnostic” téléchargeable.

Tests

E2E : user bloque quota → guide + upsell

Issue P1-5 — RAG : reranking + filtres pédagogiques (œuvre/parcours/objet d’étude)

Type: feature — Area: rag

Critères

Filtres : année, voie (générale/techno), objet d’étude, œuvre, parcours.

Reranker léger (cross-encoder ou heuristic) pour top-k.

Tests

Relevance test sur jeux de requêtes

Issue P1-6 — Écrit : correspondance explicite “barème interne ↔ attendus officiels”

Type: feature/docs — Area: eaf-written

Critères

Dans le rapport : un encadré “Ce que mesure la rubrique → attendu officiel”.

Tests

Snapshot PDF sections

Issue P1-7 — E2E Playwright “parcours élève” (oral + écrit)

Type: test — Area: test

Critères

2 scénarios : (a) oral complet (b) écrit + upload + pdf.

Tests

CI exécute E2E sur PRs principales

P2 — Dette technique + évolutions produit
Issue P2-1 — Normaliser formatting (Prettier) + lint strict
Issue P2-2 — Unifier configuration LLM (router unique, legacy isolé)
Issue P2-3 — Mode hors-ligne (Ollama only) pour démos
Issue P2-4 — “Spaced repetition” & calendrier révision automatique
Issue P2-5 — Export portfolio élève (progression, badges, objectifs)

(Je peux vous fournir ces P2 en détail également, mais les P0/P1 sont ceux qui font gagner “crédibilité EAF + SaaS”.)

2) Plan de refactor “Oral EAF” (structure + points + UI) — concret
2.1 Spécification cible (à implémenter strictement)

Préparation : 30 minutes.

Passage : 20 minutes = 12 min (lecture+explication+grammaire) + 8 min (entretien).

Barème /20 :

Lecture : /2

Explication linéaire : /8

Question de grammaire : /2

Entretien (œuvre intégrale + parcours) : /8

Objectif produit : séparer ce qui est “coaching” (riche) de ce qui est “notation EAF” (strict, borné, explicite).

2.2 Modèle de données (Prisma) — refactor recommandé

Créer/adapter une structure explicite :

Tables/champs (proposition)

OralSession

id, userId, status = DRAFT|PREP|PASSAGE|DONE|ABANDONED

prepStartedAt, prepEndedAt, passageStartedAt, passageEndedAt

draw (JSON) : textId, excerptStart, excerptEnd, grammarQuestion, workId, parcoursId

OralPhaseScore

sessionId

phase = READING|EXPLICATION|GRAMMAR|ENTRETIEN

score (int) + maxScore (2/8/2/8)

criteria (JSON) : rubriques d’évaluation

OralTranscript

sessionId, phase, transcriptText, timestamps?

OralBilan

sessionId, totalScore, breakdown JSON, pdfUrl?

Pourquoi : cela évite les ambiguïtés actuelles et rend l’UI + PDF mécaniques (moins d’IA “décideuse”, plus d’IA “coach”).

2.3 Contrats API (routes) — découpage net

POST /api/v1/oral/session/start

crée session + tirage (texte + extrait + grammaire + œuvre)

passe status=PREP + prepStartedAt

POST /api/v1/oral/session/submit-prep

sauvegarde “notes de préparation” (plan, axes, repérages)

passe prepEndedAt et status=PASSAGE

POST /api/v1/oral/session/phase

body: { phase, transcript?, selfNotes?, artifacts? }

renvoie : scoreSuggestion + coachFeedback + citations

POST /api/v1/oral/session/finalize

calcule /20 strict

génère bilan + PDF

Règle : le calcul final /20 ne dépend pas d’un texte libre ; il dépend uniquement de OralPhaseScore.score borné par max.

2.4 UI/UX “Oral” — wizard chronométré (élève)
Écran 1 — Tirage

Carte “Votre texte” : œuvre, parcours, extrait (20 lignes env. paramétrable)

Carte “Question grammaire” (liée à l’extrait)

Bouton : “Démarrer la préparation (30:00)”

Écran 2 — Préparation (30:00)

Timer visible + progression

Checklist guidée :

contexte + mouvement du texte

axes de lecture / problématique

procédés clés + citations courtes

anticipation grammaire

Agent “Prépa Coach” : suggestions non rédigées (plans, pistes), jamais une explication complète.

Écran 3 — Passage (20:00)

Sous-onglets imposés (avec timers internes indicatifs) :

Lecture (2 pts) — capture audio optionnelle + auto-feedback diction (si vous le souhaitez)

Explication (8 pts) — simulation oral : l’agent joue l’examinateur (questions courtes)

Grammaire (2 pts) — questions ciblées ; réponses courtes ; correction immédiate

Entretien (8 pts) — discussion cadrée sur œuvre intégrale + parcours, ouverture, justification

Écran 4 — Bilan

Note /20 + détail (2/8/2/8)

“Ce qui a été réussi” / “Priorités de progrès”

Recommandations personnalisées (renvois RAG)

Bouton “Refaire une session” + plan de révision automatique

2.5 Refactor du scoring : mécanique, bornée, testable

Implémenter une fonction pure :

computeOralScore({reading, explication, grammar, entretien}) -> total

Chaque phase :

score entier, borné [0..max]

criteria explicites (ex : lecture : articulation, rythme, expressivité)

L’IA propose un score suggéré + justifications, mais l’app borne et trace.

Résultat : robustesse SaaS (audit interne possible), et cohérence EAF.

3) Catalogue d’agents spécialisés EAF (100% agentique, RAG-ready)

Tous ces agents sont des “skills” orchestrés, avec :

Input schema strict (Zod),

Output schema strict (JSON),

RAG mandatory (quand pertinent) : 1–3 citations,

anti-triche : jamais de production “copie complète”.

3.1 Agents “Oral” (les indispensables)

Agent_TirageOral : choisit texte/extrait + question grammaire + œuvre/parcours (selon programme chargé dans RAG).

Agent_Prep30 : génère checklist + plan oral + repérages (sans rédaction).

Agent_CoachLecture : diction/intonation/rythme ; feedback actionnable ; score /2 (suggestion).

Agent_CoachExplicationLineaire : guide l’élève pas à pas ; vérifie transitions, analyse, citations ; score /8.

Agent_GrammaireCiblee : pose 3–6 micro-questions sur l’extrait ; corrige ; score /2.

Agent_EntretienOeuvreParcours : mène l’entretien ; pousse justification + culture ; score /8.

Agent_BilanOralOfficiel : assemble /20 + axes de progrès + renvois RAG.

3.2 Agents “Écrit” (commentaire/dissertation/contraction-essai)

Agent_DiagnosticEcrit : détecte faiblesse (langue, structure, analyse, citations).

Agent_PlanCommentaire : propose problématique + plan + micro-pistes (sans rédaction).

Agent_PlanDissertation : thèse/antithèse/synthèse ; transitions ; exemples.

Agent_ContractionCoach : méthode contraction (reformulation, proportions, neutralité).

Agent_EssaiCoach : argumentation personnelle structurée.

Agent_RelectureLangue : orthographe/ponctuation/style (sans réécrire intégralement).

Agent_BaremageEcrit : mapping barème interne ↔ attendus officiels.

3.3 Agents “Révisions / Culture / Méthode”

Agent_FichesOeuvre : fiches par œuvre + parcours (RAG)

Agent_QuizAdaptatifEAF : QCM + questions ouvertes graduées, adaptatives

Agent_CitationsEtProcedes : banque d’exemples (figures, registres, mouvements)

Agent_CarnetDeLecture : aide à bâtir notes personnelles exploitables à l’oral

Agent_SpacedRepetitionPlanner : calendrier révisions automatique

Agent_SupportProduit : facturation, quota, bugs, “self-serve” (sans humain)

“Maximum utile” = ces 20 agents couvrent 95% des besoins EAF sans basculer dans des agents redondants.

4) Simplification “un seul utilisateur : élève”
Principes

1 seul modèle User (élève)

1 seul onboarding

pas d’espace enseignant, pas de rôle admin “visible”

si besoin d’opérations (ingestion RAG, maintenance), elles sont internal-only (clé serveur / cron / endpoint non exposé UI)

Impacts (concrets)

supprimer/neutraliser tout champ role

routes “teacher” → soit supprimées, soit “internal”

UI nav : uniquement features élève (oral, écrit, révisions, abonnement, historique)
