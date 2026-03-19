# Incident RAG — production (constat via curl)

## Symptômes (preuves)
- `/api/v1/rag/health` (app) retourne `status: degraded` avec `external_rag.healthy=false`.
  - Preuve: `docs/audit_proofs/76_prod_rag_health.json`
- `/api/v1/rag/health` (headers) retourne HTTP **503**.
  - Preuve: `docs/audit_proofs/80_prod_rag_health_headers.txt`
- Le service externe `https://rag-api.nexusreussite.academy/health` retourne HTTP **504 Gateway Time-out** (nginx).
  - Preuves: `docs/audit_proofs/81_rag_api_health.txt`, `docs/audit_proofs/82_rag_api_health_headers.txt`

## Impact
- Les fonctionnalités dépendantes du RAG externe (recherche corpus / réponses avec sources) sont susceptibles d’être indisponibles, lentes, ou dégradées.
- Les autres briques (app + DB) restent opérationnelles (cf. health global).

## Cause probable
- Indisponibilité réseau ou applicative du service `rag-api` (backend down, timeout upstream, saturation, incident infra), observable par le **504** renvoyé par nginx.

## Recommandations (opérationnelles)
- Vérifier disponibilité du backend derrière `rag-api` (process/service, logs, latence, timeouts nginx/upstream, saturation).
- Mettre en place alerte et SLO sur `/health` du service RAG.
- Ajouter côté app un message UX “RAG indisponible” (dégradation maîtrisée) si ce n’est pas déjà fait.

## Remarque audit
- Cette anomalie est indépendante du SHA servi par l’app principale (prod sert `ef50c75`, health app OK).
