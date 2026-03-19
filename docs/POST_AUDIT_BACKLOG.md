# BACKLOG POST-AUDIT
**Date** : 19 mars 2026
**Verdict** : GO AVEC RÉSERVES MINEURES (État B)
**Auditeur** : Claude Opus 4.6

---

## Priorité 1 — À traiter avant lancement commercial

| # | Item | Impact | Effort |
|---|------|--------|--------|
| 1 | Configurer branch protection sur `main` (required status checks, reviews) | Sécurité du code | 10 min |
| 2 | Supprimer `ci.yml` (doublon de `ci-cd.yml`) | Clarté CI, économie runners | 5 min |
| 3 | Restreindre MCP bind à `127.0.0.1` en prod | Sécurité réseau | 5 min |

## Priorité 2 — Amélioration qualité

| # | Item | Impact | Effort |
|---|------|--------|--------|
| 4 | Relever les seuils de coverage CI (30% → 50%+) | Fiabilité | 15 min |
| 5 | Corriger titre ressource "23frgean1" | Qualité éditoriale | 5 min |
| 6 | Ajouter descriptions dans `ressources-scan.json` | SEO + UX | 2h |
| 7 | Enrichir `media-catalog.ts` (215/548 → plus) | Recommandations IA | 4h |

## Priorité 3 — Observabilité et optimisation

| # | Item | Impact | Effort |
|---|------|--------|--------|
| 8 | Vérifier les alertes budget LLM fonctionnent (email) | Coûts | 30 min |
| 9 | Ajouter Nginx HSTS `includeSubDomains; preload` | Sécurité | 5 min |
| 10 | Monitorer les restarts PM2 MCP (2 restarts observés) | Stabilité | 15 min |
| 11 | Node.js 20 → 24 migration (deadline GitHub Actions: juin 2026) | CI future | 2h |

## Éléments déjà résolus (pour mémoire)

- ✅ `.env` permissions (644 → 600)
- ✅ RAG configuré en production
- ✅ LLM_COST_TRACKING activé
- ✅ ESLint admin corrigé (CI débloquée)
- ✅ LIBRARY_TOTAL_RESOURCES corrigé (544 → 548)
- ✅ Anglicismes éditoriaux corrigés
- ✅ Nouvelle charte graphique déployée
- ✅ Homepage publique (pas de redirect login)
- ✅ Images hero servies par nginx
