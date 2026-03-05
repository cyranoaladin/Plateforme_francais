# AUDIT COMPLET — Plateforme EAF Nexus Réussite
**Date** : 5 mars 2026  
**Scope** : Tout le projet (skills LLM, routes API, pages frontend, sécurité)

---

## 🔴 PROBLÈMES CRITIQUES CORRIGÉS

### 1. Skills LLM avec prompts vagues (7 skills → TOUJOURS fallback)

Le LLM ne pouvait pas produire de JSON valide car le prompt ne spécifiait pas le `FORMAT DE SORTIE (JSON strict)`.
Résultat : chaque appel retournait systématiquement le fallback hardcodé.

| Skill | Fichier | Statut |
|-------|---------|--------|
| `coach_ecrit` | `skills/coach-ecrit.ts` | ✅ Corrigé (session précédente) |
| `coach_oral` | `skills/coach-oral.ts` | ✅ Corrigé (session précédente) |
| `coach_lecture` | `skills/oral-coach-lecture.ts` | ✅ Corrigé |
| `grammaire_ciblee` | `skills/oral-grammaire-ciblee.ts` | ✅ Corrigé |
| `ecrit_langue` | `skills/ecrit-langue.ts` | ✅ Corrigé |
| `support_produit` | `skills/support-produit.ts` | ✅ Corrigé |
| `spaced_repetition` | `skills/revision-spaced-repetition.ts` | ✅ Corrigé |
| `carnet_lecture` | `skills/revision-carnet-lecture.ts` | ✅ Corrigé |
| `pastiche` | `skills/ecrit-pastiche.ts` | ✅ Corrigé |

### 2. Quiz adaptatif — placeholders hardcodés

| Fichier | Problème | Statut |
|---------|----------|--------|
| `skills/quiz-maitre.ts` | Schema Zod trop strict (`z.literal`, `.length(4)`) | ✅ Assoupli (`z.coerce`, `.min(2).max(6)`) |
| `api/v1/quiz/generate/route.ts` | Fallback "Proposition A/B/C/D" | ✅ Remplacé par erreur 503 propre |
| `app/quiz/page.tsx` | Erreurs réseau ignorées silencieusement | ✅ Error state + loading ajoutés |

### 3. Parcours — mauvais skill LLM

| Fichier | Problème | Statut |
|---------|----------|--------|
| `api/v1/parcours/generate/route.ts` | Utilisait `tuteur_libre` (mauvais skill) | ✅ Corrigé → `sr_planner` |

### 4. Sécurité — identifiants hardcodés

| Fichier | Problème | Statut |
|---------|----------|--------|
| `app/login/page.tsx:10-12` | `jean@eaf.local` / `demo1234` pré-remplis | ✅ Champs vides |
| `app/login/page.tsx:164-167` | Identifiants affichés dans l'UI | ✅ Texte neutre |
| `api/v1/oral/session/start/route.ts:27` | Bypass quota/rate-limit pour `jean@eaf.local` | ✅ Supprimé |

---

## 🟡 PROBLÈMES MOYENS (non bloquants, à surveiller)

### 5. `E2E_DISABLE_RATE_LIMIT` dans `auth/login/route.ts`
- L'env var `E2E_DISABLE_RATE_LIMIT=1` désactive le rate-limiting sur le login.
- **Risque** : si défini en prod par erreur → brute-force possible.
- **Recommandation** : vérifier que cette var N'EST PAS dans le `.env` de production.

### 6. Fallback store avec identifiants démo (`lib/db/fallback-store.ts`)
- Le seed `jean@eaf.local` avec hash de `demo1234` est créé si la DB n'est pas dispo.
- **Risque** : si Prisma tombe en prod → login possible avec identifiants connus.
- **Recommandation** : désactiver le fallback store en production ou utiliser un mot de passe aléatoire.

### 7. `atelier-langue` — seulement 2 exercices statiques
- `app/atelier-langue/page.tsx` contient un tableau `EXERCISES` avec 2 phrases hardcodées.
- `lib/evaluation/langue.ts` évalue par keyword-matching (pas de LLM).
- **Impact** : l'atelier langue sera toujours les mêmes 2 exercices.
- **Recommandation** : connecter au LLM via le skill `ecrit_langue` pour générer des exercices dynamiques.

### 8. `exam-blanc-generator.ts` — fallback silencieux
- Si le LLM échoue, retourne `sujet: "génération indisponible"`, `texte: ""`.
- **Recommandation** : propager l'erreur plutôt que retourner un exam vide.

---

## ✅ SKILLS AVEC BONS PROMPTS (aucune correction nécessaire)

`tuteur_libre`, `correcteur`, `bibliothecaire`, `oral_tirage`, `coach_explication`,
`oral_entretien`, `oral_bilan_officiel`, `oral_prep30`, `examinateur_virtuel`,
`ecrit_plans`, `ecrit_contraction`, `ecrit_essai`, `ecrit_diagnostic`, `ecrit_baremage`,
`revision_fiches`, `quiz_adaptatif`, `citations_procedes`, `sr_planner`

---

## FICHIERS MODIFIÉS (12 fichiers)

### Skills LLM (7 fichiers)
1. `src/lib/llm/skills/oral-coach-lecture.ts`
2. `src/lib/llm/skills/oral-grammaire-ciblee.ts`
3. `src/lib/llm/skills/ecrit-langue.ts`
4. `src/lib/llm/skills/support-produit.ts`
5. `src/lib/llm/skills/revision-spaced-repetition.ts`
6. `src/lib/llm/skills/revision-carnet-lecture.ts`
7. `src/lib/llm/skills/ecrit-pastiche.ts`

### Routes API (2 fichiers)
8. `src/app/api/v1/parcours/generate/route.ts`
9. `src/app/api/v1/oral/session/start/route.ts`

### Pages Frontend (1 fichier)
10. `src/app/login/page.tsx`

### Déjà déployés (session précédente, inclus pour rebuild)
11. `src/lib/llm/skills/quiz-maitre.ts`
12. `src/app/api/v1/quiz/generate/route.ts`
13. `src/app/quiz/page.tsx`
