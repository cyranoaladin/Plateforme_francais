# Audit Technique Réel - Nexus EAF

Date de référence: 5 mars 2026
Portée: état actuel du code du dépôt local.

## Résumé exécutif

Le projet a traité les principaux points bloquants de l'audit initial (hardcoded oral, quota LLM, sécurité upload, CSP, timeout RAG, robustesse orchestrateur). La base est solide côté architecture et sécurité applicative, mais la couverture globale mesurée reste insuffisante si on impose les seuils de couverture configurés.

## Points critiques corrigés

1. Atelier oral: suppression des scores statiques UI, bilan final via endpoint backend.
2. Quotas LLM: rpm + daily par utilisateur et skill, mode fail-closed.
3. Upload copies: détection MIME réelle (magic bytes) + nom de fichier assaini.
4. CSP: headers stricts + nonce runtime côté middleware.

## Points importants corrigés

1. Timeout RAG externe réduit à 8s avec fallback local.
2. Worker de correction avec retries exponentiels et sortie en statut `error` après échecs.
3. Validation des sorties LLM sur schémas + fallback non bloquant.
4. CI/CD enrichi (contrats, mutation, perf, ZAP en gates dédiées selon déclencheur).

## Extensions “niveau exhaustif” livrées

1. Annotation interactive de copie (overlay zones liées aux annotations).
2. Simulation examinateur dialoguant (persona + mémoire conversationnelle).
3. Dashboard: composant de progression intégré.

## Mesures factuelles

- Routes API v1: 47
- Tests versionnés:
  - 169 fichiers totaux
  - 168 fichiers de suites de tests
- Exécution de référence: `npm run test:unit -- --coverage`
  - 135 fichiers de tests exécutés
  - 938 tests passés
  - couverture lignes: 47.48%
- Exécution Gate 2 CI: `npx vitest run tests/unit --coverage`
  - 114 fichiers de tests exécutés
  - 862 tests passés
  - couverture lignes: 45.66%
- gate coverage CI: actif en progressif (lignes >= 45), cible long terme 85%+

## Risques/écarts restants

1. Couverture globale encore sous les seuils configurés.
2. Certaines suites (contrats/E2E/perf/ZAP) présentes mais non systématiquement exécutées localement dans cette passe.
3. Quelques documents historiques obsolètes ont été archivés pour éviter toute confusion d'audit.

## Conclusion

Le projet est nettement plus conforme aux exigences de robustesse et sécurité que l'état initial décrit dans l'audit de mars 2026. La priorité résiduelle est la montée effective de couverture réelle sur zones peu testées pour aligner les seuils CI avec l'exécution réelle.
