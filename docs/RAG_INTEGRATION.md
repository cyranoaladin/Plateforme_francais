# Intégration RAG (État Actuel)

Dernière mise à jour: 5 mars 2026

## Configuration clé

- `RAG_API_URL`: endpoint du service RAG externe
- `RAG_API_TOKEN`: token d'authentification
- `RAG_COLLECTION`: collection cible
- `RAG_TIMEOUT_MS`: timeout requête externe (défaut actuel: `8000`)

## Comportement

1. Tentative recherche sur RAG externe.
2. En cas d'erreur/timeout, retour `results: []` côté client externe.
3. Le service de recherche applicatif active le fallback local/lexical pour éviter une réponse vide.

## Références code

- Client externe: `src/lib/rag/external-client.ts`
- Orchestration recherche/fallback: `src/lib/rag/search.ts`
- Tests: `tests/unit/rag/external-client.test.ts`, `tests/unit/rag/hybrid-search.test.ts`, `tests/unit/rag/golden-queries.test.ts`
