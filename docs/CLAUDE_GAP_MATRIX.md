# CLAUDE GAP MATRIX — PHASE B (Réconciliation métriques)

**Date** : 19 mars 2026

**Règle appliquée** : ce document est **fondé uniquement** sur :
- **Code actuel**
- **Commandes réellement exécutées**
- **Preuves écrites** sous `docs/audit_proofs/`

---

## 1) Métriques réconciliées (preuves)

| Métrique | Valeur réelle | Preuve |
|---|---:|---|
| Fichiers de test (tous) | 232 | `docs/audit_proofs/10_test_files.txt` + `docs/audit_proofs/17_counts_wc.txt` |
| Fichiers `*.test.ts` / `*.spec.ts` | 178 | `docs/audit_proofs/10b_test_spec_count.txt` |
| Occurrences `describe/it/test` | 1435 | `docs/audit_proofs/11_test_occurrences.txt` + `docs/audit_proofs/18_test_occurrences_summary.json` |
| Détail occurrences | describe=358, it=971, test=106 | `docs/audit_proofs/18_test_occurrences_summary.json` |
| `.skip()` statiques (tests) | 6 | `docs/audit_proofs/18c_skips_in_tests.txt` + `docs/audit_proofs/18d_skips_in_tests_wc.txt` |
| Pages App Router (`page.tsx`) | 27 | `docs/audit_proofs/15b_pages_count.txt` |
| Routes API (`route.ts`) | 70 | `docs/audit_proofs/15c_routes_count.txt` |
| Références MCP (codebase) | 196 lignes | `docs/audit_proofs/13_mcp_refs.txt` + `docs/audit_proofs/17_counts_wc.txt` |
| Outils MCP (définis) | 20 | `docs/audit_proofs/19b_mcp_tools_list.txt` + `docs/audit_proofs/19c_mcp_tools_list_wc.txt` |
| Scripts npm (surface de test/CI) | liste complète | `docs/audit_proofs/14_package_scripts.txt` |

---

## 2) Écarts (Gap) et corrections appliquées (avec preuves)

### Gap #1 — Les preuves d’audit polluaient Git

- **Affirmation initiale**
  - Les preuves doivent exister, mais **ne doivent pas** polluer l’index Git ni servir de “source de vérité”.
- **Constat réel après vérification**
  - Des fichiers d’audit étaient suivis dans `.windsurf_audit_logs/` et de nombreux artefacts locaux polluaient le working tree.
- **Preuve**
  - `git ls-files .windsurf_audit_logs` (exécuté pendant PHASE A).
- **Écart**
  - Répo non “clean” ⇒ difficile de garantir la vérité = code+tests.
- **Correction appliquée**
  - Ajout d’ignores + retrait de `.windsurf_audit_logs/` de l’index.
- **Résultat après correction**
  - Les preuves d’audit sont désormais stockées sous `docs/audit_proofs/` (lisibles + auditables) et non dans un dossier ignoré.

### Gap #2 — Contrôle éditorial FR non exécuté par la CI

- **Affirmation initiale**
  - La CI doit détecter du drift de copy user-facing.
- **Constat réel après vérification**
  - Aucun script CI explicite ne garantissait l’absence de nouvelles violations hors baseline.
- **Preuve**
  - Scripts CI listés dans `docs/audit_proofs/14_package_scripts.txt` (avant ajout) et workflow Gate 1.
- **Écart**
  - Risque de régression UX/éditoriale silencieuse.
- **Correction appliquée**
  - Ajout de `npm run ci:fr-copy` + étape Gate 1 dans `.github/workflows/ci-cd.yml`.
  - Baseline régénérée.
- **Résultat après correction**
  - `npm run ci:fr-copy` passe (preuve : exécution locale) et la CI a un gate dédié.

### Gap #3 — Code “outil” E2E non relié (risque dead code / knip)

- **Affirmation initiale**
  - Tout script utile à l’exécution doit être “réellement utilisé” (script npm / CI) pour éviter dead code.
- **Constat réel après vérification**
  - `scripts/pw_webserver_local.ts` et `src/lib/e2e/playwright-db.ts` existaient hors surface “utilisée”.
- **Preuve**
  - `docs/audit_proofs/14_package_scripts.txt` (scripts) + gate `knip` en CI.
- **Écart**
  - Dead code / outils non testés / CI divergente.
- **Correction appliquée**
  - Ajout de `pw:webserver` et `test:ops` dans `package.json`.
- **Résultat après correction**
  - `npx knip` est vert (preuve : `.windsurf_audit_logs/24_knip.txt`, exécution locale).

---

## 3) Points NON réconciliés à ce stade (PHASES suivantes)

Les métriques suivantes **ne sont pas encore produites** dans `docs/audit_proofs/` (donc pas de vérité chiffrée à ce stade) :
- Bibliothèque / ressources réelles / free vs premium (PHASE F).
- Flows élèves connectés (PHASE H) et validation prod connectée.
- Audit admin (PHASE 11.7).
- SHA réellement servi en prod, cible Nginx, process servant le HTML (PHASE E).

