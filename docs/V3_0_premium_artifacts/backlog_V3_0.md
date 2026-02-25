# Backlog V3.0 – Plateforme EAF Premium (Première voie générale)

**Principe directeur (non négociable)** : la V3.0 doit produire une **progression mesurable** via un cycle fermé :
Diagnostic → Plan → Séances guidées → Correction → Banque d’erreurs → Re-test.

## Références officielles à intégrer (Authority A)
- BOEN programme national d’œuvres 2025-2026 (voie générale) : https://www.education.gouv.fr/bo/2024/Hebdo30/MENE2418442N
- Éduscol détail des épreuves bac général (EAF) : https://eduscol.education.fr/727/detail-des-epreuves-du-baccalaureat-general
- BOEN centres à l’étranger (calendriers spécifiques) : https://www.education.gouv.fr/bo/2025/Hebdo40/MENE2526851N

## EPIC 0 — Gouvernance & “Premium Gate” (P0)
**Objectif** : rendre impossible une version “jolie mais inefficace”.  
**DoD** : KPI pédagogiques + golden tests + refus normatifs non sourcés.

### Tickets P0
- **P0-0.1** Définir les KPI pédagogiques V3.0 (skill map, erreurs résolues J+7, temps de formulation problématique).
- **P0-0.2** Mettre en place `golden_tests_v3_0.yaml` + runner CI (mock) + runner staging (réel).
- **P0-0.3** Implémenter la règle : *toute réponse normative sans citation authority A → refus* (ask + coach + planner).

## EPIC 1 — Modèle élève : SkillMap + ErrorBank + Evidence (P0)
**Objectif** : personnalisation réelle, traçable.
### Tickets P0
- **P0-1.1** Prisma : tables `student_skills`, `error_bank`, `study_plan`, `resources` (+ migrations).
- **P0-1.2** `StudentModeler` : update skill map après chaque submission/séance guidée.
- **P0-1.3** `BankOfErrors` : création automatique d’items (catégorie, exemple, correction, plan J+2/J+7/J+21).

## EPIC 2 — Onboarding Diagnostic (P0)
**Objectif** : produire en 15–25 minutes une skill map + un plan 7 jours.
### Tickets P0
- **P0-2.1** API `POST /api/v2/onboarding/diagnostic` (Zod) : écrit court + quiz grammaire + oral transcript.
- **P0-2.2** UI Wizard onboarding (progress bar, timebox, UX accessible).
- **P0-2.3** `DiagnosticScorer` : rubrics + evidence + 3–5 priorités d’action.
- **P0-2.4** Générer `StudyPlan` de 7 jours (4–7 séances) + ressources initiales.

## EPIC 3 — Planner : plan hebdo adaptatif (P0)
**Objectif** : planifier et adapter selon progrès/stagnation.
### Tickets P0
- **P0-3.1** API `GET /api/v2/plan/week` + `POST /api/v2/sessions/start`.
- **P0-3.2** `Planner` : règles de génération (durées 10/25/60), mix axes, contraintes calendrier EAF.
- **P0-3.3** `ProgressAuditor` : si stagnation sur 2 cycles → changer stratégie (plus guidé / retour méthodo).

## EPIC 4 — Séances guidées (P0)
**Objectif** : 10–20 minutes quotidiennes, très efficaces.
### Tickets P0
- **P0-4.1** “Séance 10 min” (écrit) : problématique → feedback → 2 alternatives → mini exercice correctif.
- **P0-4.2** “Séance 10 min” (langue) : phrase complexe / relatives / connecteurs → correction + rappel + re-test.
- **P0-4.3** “Séance 10 min” (oral) : plan d’explication linéaire (mouvements) sur extrait court.
- **P0-4.4** Stocker evidence + mettre à jour skill map + générer due_dates ErrorBank.

## EPIC 5 — ResourceCards multimodales + Bibliothécaire premium (P0)
**Objectif** : proposer vidéos/podcasts/pdf/html avec consignes d’usage et justification.
### Tickets P0
- **P0-5.1** Prisma `resources` + CRUD admin minimal.
- **P0-5.2** Modèle `ResourceCard` + moteur de recommandation (fit objectives + level + time).
- **P0-5.3** UI Bibliothèque : recherche + filtres (objet d’étude, œuvre, durée, niveau) + “quoi faire après”.

## EPIC 6 — Ingestion sémantique V3 (P1)
**Objectif** : ingestion versionnée, chirurgicale, anti-poisoning.
### Tickets P1
- **P1-6.1** `registry_v3_0.yaml` : loader + validation + diff versions.
- **P1-6.2** Pipeline : fetch → normalize → chunk → embed → upsert (avec metadata obligatoire).
- **P1-6.3** Gestion versions corpus + priorité au plus récent authority A.
- **P1-6.4** Tests ingestion : hash, citations valides, refus hors corpus.

## EPIC 7 — UX premium (P1)
- **P1-7.1** Dashboard “One best next action” + plan semaine + skill map (heatmap).
- **P1-7.2** Parcours différenciés (4) : difficulté / 14+ / désorganisé / oral prioritaire.
- **P1-7.3** Cahier d’erreurs : liste, exercices, révisions planifiées (J+2/J+7/J+21).

## EPIC 8 — Observabilité & qualité (P1)
- **P1-8.1** Métriques pédagogiques : progression skill map, erreurs résolues, temps séance, re-test success.
- **P1-8.2** Logging : refus attendus 403 sans stacktrace ; stacktrace réservée 5xx.

## EPIC 9 — Conformité (P0 continu)
- **P0-9.1** AI Act : bannir toute inférence émotionnelle (tests + guardrail post-gen).
- **P0-9.2** Mineurs : flux consentement + 403 strict si <15 sans parent_ok.
- **P0-9.3** Mode examen : interdiction rédaction complète + assistance limitée (checklists/méthodo).

---

## Définition of Done V3.0 (acceptation)
1) Onboarding produit **SkillMap + plan 7 jours** et s’enregistre en DB.
2) L’élève peut faire 3 séances guidées (écrit/langue/oral) et voir SkillMap évoluer.
3) ErrorBank génère des révisions J+2/J+7/J+21 et l’UI les affiche.
4) Bibliothèque recommande des ResourceCards justifiées (vidéo/podcast/pdf/html).
5) Golden tests : normatif (citations) + sécurité + mode examen passent en CI (mock) et en staging (réel).
