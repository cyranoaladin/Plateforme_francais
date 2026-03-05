# Architecture Système Détaillée

Dernière mise à jour: 5 mars 2026

## Vue d'ensemble

Application monolithique Next.js (App Router) avec API intégrée, services LLM/RAG, persistance Prisma/PostgreSQL et composants de sécurité transverses.

## Couches

1. Interface web
- Pages Next.js dans `src/app/**`
- Flux clés: atelier écrit, atelier oral, dashboard, enseignant.

2. API applicative
- 47 routes v1 dans `src/app/api/v1/**/route.ts`
- Contrôles communs: auth, CSRF, validation requêtes, quotas LLM.

3. Domaine métier
- Oral: `src/lib/oral/**`
- Épreuves/corrections: `src/lib/epreuves/**`, `src/lib/correction/**`
- Mémoire/parcours: `src/lib/memory/**`, `src/lib/agents/**`

### Couche agents (`src/lib/agents/**`)

Agents/orchestrateurs métier identifiés:
- `router.ts`: routage d'agent en fonction du contexte élève.
- `diagnosticien.ts`: diagnostic des compétences.
- `planner.ts`: planification d'actions/recommandations.
- `rappel-agent.ts`: rappels guidés.
- `rapport-auto.ts`: génération de rapports automatiques.
- `student-modeler.ts`: enrichissement du modèle élève.
- `policy-gate.ts`: filtrage conformité/anti-abus.

4. IA
- Orchestrateur: `src/lib/llm/orchestrator.ts`
- Skills: `src/lib/llm/skills/**`
- Guardrails anti-triche: `src/lib/compliance/anti-triche.ts`

5. Recherche/RAG
- Client externe: `src/lib/rag/external-client.ts`
- Fallback/search: `src/lib/rag/search.ts`
- Indexing/ingestion: `src/lib/rag/indexer.ts`, `src/lib/rag/ingestion/pipeline.ts`

6. Données
- Prisma + PostgreSQL/pgvector
- Redis pour rate-limits/queues

### Redis - comportement attendu

- Version recommandée: Redis 7+.
- Rate-limit générique:
  - production: fail-closed si Redis indisponible
  - développement: fallback mémoire.
- Quotas LLM: fail-closed si Redis indisponible.
- Queue correction: fallback worker in-process si BullMQ/Redis indisponible.

## Flux critiques

### Atelier oral
- Start session: `/api/v1/oral/session/start`
- Interactions par étape: `/api/v1/oral/session/:sessionId/interact`
- Finalisation bilan: `/api/v1/oral/session/:sessionId/end`
- Relances examinateur avancées: `/api/v1/oral/jury-respond`

### Atelier écrit
- Génération sujet: `/api/v1/epreuves/generate`
- Upload copie: `/api/v1/epreuves/:epreuveId/copie`
- Polling statut correction: `/api/v1/epreuves/:epreuveId/copie/:copieId`
- Fichier copie sécurisé: `/api/v1/epreuves/copies/:copieId/file`
- Rapport PDF: `/api/v1/epreuves/copies/:copieId/report`

## Résilience

- RAG externe: timeout 8s + fallback local.
- Correction copie: retry exponentiel x3 puis statut `error`.
- LLM: fallback structuré sur erreur provider/parse/schéma.
- Rate-limit LLM: fail-closed en cas d'indisponibilité Redis.

## Sécurité transversale

- Middleware global avec headers de sécurité et nonce CSP.
- Validation CSRF sur endpoints mutateurs.
- Validation upload par signature binaire.
- Contrôles RBAC sur endpoints enseignants.
