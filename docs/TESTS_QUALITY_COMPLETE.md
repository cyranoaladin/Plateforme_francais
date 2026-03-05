# Tests & Qualité - État Réel

Dernière mise à jour: 5 mars 2026

## Inventaire tests

- Commandes de référence:
  - `find tests -type f | wc -l` -> 169
  - `find tests -type f | sed 's#^tests/##' | rg -v '^(unit|integration|e2e|contracts|security|performance)/'` -> 1 fichier hors suite (`fixtures/copie-test.png`)
- Répartition des suites:
  - Unitaires: 120 (`tests/unit/**`)
  - Intégration: 21 (`tests/integration/**`)
  - E2E: 14 (`tests/e2e/**`)
  - Contrats: 11 (`tests/contracts/**`)
  - Sécurité: 1 (`tests/security/**`)
  - Performance: 1 (`tests/performance/**`)
  - Total suites: 168

## Exécution de référence

Commandes exécutées:
- `npm run test:unit -- --coverage` (suite unit + integration selon `vitest.config.ts`)
- `npx vitest run tests/unit --coverage` (commande utilisée dans la Gate 2 CI)

Résultat observé:
- Run global (`npm run test:unit -- --coverage`):
  - Test files: 135 passed
  - Tests: 938 passed
  - Coverage lines: 47.48%
- Run Gate 2 (`npx vitest run tests/unit --coverage`):
  - Test files: 114 passed
  - Tests: 862 passed
  - Coverage lines: 45.66%
- Coverage gate:
  - long terme cible: 85/90/80/85
  - état courant (progressif au 5 mars 2026): lignes >= 45 (bloquant CI)

## Couverture fonctionnelle notable

1. LLM
- orchestrateur, guardrails, quotas, provider-factory
- tests skills: correcteur, coach_oral, coach_ecrit, quiz_maitre, tuteur_libre

2. RAG
- external client timeout/fallback
- fusion RRF
- golden queries
- pipeline ingestion/indexation

3. Sécurité
- CSRF, rate limit, upload MIME, RBAC, prompt injection

4. Correction copies
- OCR
- barème/rubriques
- worker retry/DLQ
- report generator
- annotation mapper

5. Oral
- session/service/evaluator/chrono/extraits
- API jury-respond dialoguant

6. UI pédagogique
- upload-copie
- rapport-correction
- oral-simulator
- chat-tuteur
- quiz-player

## Limites actuelles de qualité

1. Les tests passent massivement, mais la couverture globale mesurée reste sous la cible long terme (85% lignes).
2. Les suites E2E/contrats/perf/sécurité existent mais doivent être lancées explicitement selon contexte.

## Exécution CI des suites

- Gate 4 Playwright exécute les specs E2E du dossier `tests/e2e/**` sur Chromium.
- Perf (`tests/performance/**`), ZAP (`tests/security/**`) et mutation ne sont pas sur chaque PR; voir la politique de déclenchement dans `docs/DEPLOYMENT_INFRASTRUCTURE_COMPLETE.md`.

## Cible court terme

- Cibles chiffrées par module (falsifiables):
  - `src/app/api/v1/**`: >= 65% lignes, >= 55% branches
  - `src/lib/llm/**`: >= 75% lignes, >= 70% branches
  - `src/lib/correction/**`: >= 80% lignes, >= 70% branches
  - `src/lib/rag/**`: >= 70% lignes, >= 60% branches
- Rampe coverage globale:
  - phase actuelle: gate bloquante lignes >= 45
  - prochaine phase: lignes >= 65
  - cible finale: lignes >= 85
