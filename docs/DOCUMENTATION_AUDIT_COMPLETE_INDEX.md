# Documentation Audit - Index Canonique

Dernière mise à jour: 5 mars 2026
Statut: source de vérité documentaire pour audit technique/sécurité/tests.

## Objectif

Ce dossier documente l'état réel du projet au 5 mars 2026 et constitue une base d'audit avec réserves explicites:

1. Couverture de tests globale encore inférieure à la cible long terme 85%.
2. Gates perf/ZAP/mutation non exécutées sur chaque PR (déclenchement ciblé).
3. Conformité réglementaire formelle (RGPD/ISO) dépend de documents organisationnels hors dépôt.

## Corpus canonique (à auditer en priorité)

1. `docs/AUDIT_REPORT_COMPLETE.md`
2. `docs/ARCHITECTURE_SYSTEM_DETAILED.md`
3. `docs/SECURITY_COMPLIANCE_COMPLETE.md`
4. `docs/TESTS_QUALITY_COMPLETE.md`
5. `docs/APIS_INTEGRATIONS_COMPLETE.md`
6. `docs/TECHNICAL_SPECIFICATIONS_COMPLETE.md`
7. `docs/DEPLOYMENT_INFRASTRUCTURE_COMPLETE.md`

## Snapshot projet vérifié

- API routes: 47 (`src/app/api/v1/**/route.ts`)
- Tests dans le repo:
  - 169 fichiers au total (`find tests -type f | wc -l`)
  - 168 fichiers classés par suites (`unit|integration|e2e|contracts|security|performance`)
  - 1 fichier fixture hors suite (`tests/fixtures/copie-test.png`)
- Exécution de référence (5 mars 2026):
  - commande globale: `npm run test:unit -- --coverage` -> 135 fichiers, 938 tests, 47.48% lignes
  - commande Gate 2 CI: `npx vitest run tests/unit --coverage` -> 114 fichiers, 862 tests, 45.66% lignes
- CI/CD: workflow multi-gates `/.github/workflows/ci-cd.yml`
  - Gate coverage active en mode progressif (lignes >= 45 au 5 mars 2026)

## Traçabilité audit -> preuve code

- Rate limiting LLM: `src/lib/security/llm-rate-limiter.ts`
- Validation upload (magic bytes): `src/lib/security/file-validator.ts`
- CSP + nonce: `next.config.ts`, `middleware.ts`
- Orchestrateur LLM + fallback schéma: `src/lib/llm/orchestrator.ts`
- RAG timeout 8s: `src/lib/rag/external-client.ts`
- Worker correction retry + état erreur: `src/lib/epreuves/worker.ts`
- Annotation interactive copie: `src/lib/correction/annotation-mapper.ts`, `src/app/atelier-ecrit/correction/[copieId]/page.tsx`
- Examinateur dialoguant: `src/app/api/v1/oral/jury-respond/route.ts`, `src/app/atelier-oral/page.tsx`

## Politique documentaire

- Tout document non listé dans le corpus canonique est informatif/historique.
- En cas de divergence, le code et les tests exécutables priment.
