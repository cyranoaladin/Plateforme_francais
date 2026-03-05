# Déploiement & Infrastructure - État Réel

Dernière mise à jour: 5 mars 2026

## Pipeline CI/CD

Fichier: `/.github/workflows/ci-cd.yml`

Gates principales:
1. Analyse statique (tsc, lint, audit deps, knip, audit CSRF)
2. Tests unitaires + coverage gate + tests de contrats schéma LLM
3. Tests intégration (Postgres/Redis)
3b. Tests contrats API (Schemathesis + RBAC scripts)
4. E2E Playwright
5. Sécurité (npm audit, Gitleaks, Snyk, CodeQL)
5b. Performance Artillery (`workflow_dispatch` ou tag release)
5c. OWASP ZAP (`workflow_dispatch` + cron hebdomadaire)
5d. Mutation tests Stryker (`workflow_dispatch` + cron mensuel)
6. Déploiement staging/prod (blue-green)

## Gate coverage - état réel

- Au 5 mars 2026:
  - couverture globale (`npm run test:unit -- --coverage`): 47.48% lignes
  - couverture Gate 2 (`npx vitest run tests/unit --coverage`): 45.66% lignes
- Le gate coverage est actif et bloquant avec seuil progressif: lignes >= 45.
- La cible long terme reste 85/90/80/85.
- Roadmap de remontée:
  - phase 1: lignes >= 45 (actif)
  - phase 2: lignes >= 65
  - phase 3: lignes >= 85

## Politique de déclenchement des gates spécialisées

| Gate | Déclencheur | Fréquence | Politique en cas d'échec |
|---|---|---|---|
| 5b Performance (Artillery) | `workflow_dispatch` ou tag `v*.*.*` | À la release | Bloque la release tag |
| 5c OWASP ZAP | `workflow_dispatch` ou cron `0 2 * * 1` | Hebdomadaire | Incident sécurité + remédiation prioritaire |
| 5d Mutation (Stryker) | `workflow_dispatch` ou cron `0 3 1 * *` | Mensuel | Rapport qualité, action plan dans sprint suivant |

## Déploiement production

- Stratégie blue/green avec bascule slot actif.
- Smoke check HTTP sur nouveau slot avant switch.
- Canary post-déploiement via healthcheck 5 min.

## Procédure de rollback

1. Si smoke check pré-switch échoue: arrêt du déploiement, aucun switch de slot.
2. Si healthcheck post-deploy échoue:
  - rebasculer `active-slot.txt` sur le slot précédent
  - `nginx -s reload`
  - arrêter le slot fautif via PM2
3. Ouvrir un incident avec horodatage, SHA déployé, logs applicatifs, cause estimée.
4. Aucune reprise de déploiement sans validation manuelle.

## Dépendances runtime

- PostgreSQL
- Redis
- Variables d'environnement de sécurité (`SESSION_SECRET`, `CSRF_SECRET`)
- Clés providers LLM selon environnement

## Risques opérationnels restants

1. Les gates perf/ZAP/mutation ne tournent pas sur chaque push (déclenchement ciblé assumé).
2. Le niveau de couverture réel doit encore monter pour atteindre la cible long terme de 85%.
