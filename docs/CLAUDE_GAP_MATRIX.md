# MATRICE DES ÉCARTS — AUDIT SECONDE PASSE (Claude Opus)
**Date** : 19 mars 2026
**Auditeur** : Claude Opus 4.6

---

## Métriques réconciliées

| Métrique | Valeur annoncée précédemment | Valeur réelle vérifiée | Source |
|----------|------------------------------|----------------------|--------|
| Fichiers de test | 159 / 177 (contradictoire) | **178** | `find tests -type f \( -name "*.test.ts" -o -name "*.spec.ts" \)` |
| Tests actifs | 1098 / 605 (contradictoire) | **1103** | `npx vitest run` — 1103 passed |
| Tests skip permanents | non précisé | **0** | grep `.skip()` — aucun statique |
| Fichiers source | non vérifié | **306** | `find src -type f` |
| Skills LLM | variable | **29** configs, **43** skills routées (5 tiers) | `src/lib/llm/skills/` + `router.ts` |
| Outils MCP | variable | **20** outils + 3 prompts + 3 ressources | `packages/mcp-server/src/server.ts` |
| Ressources bibliothèque | 544 annoncé | **548** réel | `ressources-scan.json` + serveur |

## Écarts critiques corrigés

| # | Écart | Impact | Correction | Preuve |
|---|-------|--------|-----------|--------|
| 1 | `.env` permissions 644 | Sécurité HIGH | `chmod 600` | `-rw-------` |
| 2 | RAG non configuré en prod | 13,661 chunks inaccessibles | Ajout env vars PM2 | `rag/health` → ok |
| 3 | `LLM_COST_TRACKING` désactivé | Aucun suivi coûts | Ajout env var | Active |
| 4 | ESLint cassant CI (10 runs failed) | Pipeline inopérant | Fix `any`, `catch`, `useCallback` | 0 errors |
| 5 | `LIBRARY_TOTAL_RESOURCES` = 544 | Paywall incorrect | Corrigé à 548 + tests | 1103/1103 |
| 6 | Anglicismes résiduels | Qualité éditoriale | dashboard→tableau de bord, etc. | Vérifié |

## Backlog non bloquant

| # | Écart | Recommandation |
|---|-------|---------------|
| 1 | Branch protection absente | Configurer required status checks |
| 2 | Workflows CI dupliqués | Supprimer `ci.yml` |
| 3 | MCP 0.0.0.0:3100 | Restreindre 127.0.0.1 |
| 4 | 1 titre ressource brut "23frgean1" | Corriger dans scan |
| 5 | Coverage gate CI 30% | Relever progressivement |
