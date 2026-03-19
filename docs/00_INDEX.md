# Index documentaire canonique — Nexus Réussite EAF

Dernière consolidation documentaire : 14 mars 2026

Ce fichier est la table des matières officielle de la documentation du projet. La documentation a été consolidée pour être :

- autosuffisante
- cohérente avec l’état actuel du dépôt
- exploitable sans lecture préalable des sources
- orientée produit, architecture, exploitation et maintenance

## Ce que couvre la documentation canonique

La documentation canonique couvre l’intégralité du périmètre utile du dépôt :

- vision produit
- rôles utilisateurs et navigation
- architecture globale
- structure réelle du dépôt
- pages applicatives
- routes API versionnées
- services métier dans `src/lib`
- modèle Prisma et persistance
- billing, paiements, quotas et gating
- IA, orchestrateur, skills, RAG et MCP
- sécurité, conformité, CSRF, RBAC, sanitation et rate limits
- files d’attente, stockage, notifications, cron et exploitation
- stratégie de tests et validation
- arborescence complète utile du repo

## Faits vérifiés dans le dépôt

Les chiffres suivants ont été vérifiés dans l’état courant du dépôt :

- `23` pages `page.tsx` dans `src/app`
- `60` routes API dans `src/app/api/v1`
- `37` modèles Prisma
- `21` enums Prisma
- `20` outils MCP exposés par `packages/mcp-server/src/server.ts`
- `183` fichiers de tests unitaires
- `23` fichiers de tests d’intégration
- `15` specs Playwright E2E

## Ordre de lecture recommandé

### 1. Orientation générale

- `README.md`
- `docs/00_INDEX.md`
- `docs/01_SYSTEME_COMPLET.md`

### 2. Référence applicative

- `docs/02_API_REFERENCE_COMPLETE.md`
- `docs/03_TECHNIQUE_DONNEES_IA_MCP.md`

### 3. Exploitation

- `docs/04_EXPLOITATION_TESTS_DEPLOIEMENT.md`
- `docs/05_ARBORESCENCE_COMPLETE.md`

## Rôle de chaque document canonique

### `README.md`

Point d’entrée rapide du projet : finalité, stack, démarrage, modules majeurs, lecture recommandée.

### `docs/01_SYSTEME_COMPLET.md`

Vue exhaustive du produit : objectifs, rôles, navigation, flux métier, zones fonctionnelles et responsabilités des grands modules.

### `docs/02_API_REFERENCE_COMPLETE.md`

Référence consolidée des `60` routes API versionnées avec regroupement par domaine fonctionnel.

### `docs/03_TECHNIQUE_DONNEES_IA_MCP.md`

Référence technique détaillée : architecture interne, persistance, billing, sécurité, RAG, orchestrateur LLM, agents, serveur MCP et scripts techniques.

### `docs/04_EXPLOITATION_TESTS_DEPLOIEMENT.md`

Guide d’exploitation : setup local, commandes, exécution, PM2, worker, cron, tests, validation et maintenance courante.

### `docs/05_ARBORESCENCE_COMPLETE.md`

Arborescence complète utile du dépôt, destinée à permettre un repérage rapide sans exploration manuelle des sources.

## Politique documentaire

À partir de cette consolidation :

- les documents ci-dessus constituent la source de vérité documentaire
- les documents plus anciens, redondants, placeholders ou contradictoires doivent être supprimés
- en cas de divergence entre documentation historique et code, le code reste la référence ultime
- toute nouvelle documentation doit s’intégrer dans ce socle canonique au lieu de recréer un nouveau centre de gravité documentaire

## Limites volontaires

Le fichier d’arborescence complet couvre le repo utile et exclut volontairement les éléments non pertinents pour la compréhension du projet :

- `node_modules`
- `.git`
- logs de runtime
- artefacts de couverture
- sorties temporaires et répertoires générés

Ce choix a été validé pour préserver la lisibilité et l’utilité documentaire.
