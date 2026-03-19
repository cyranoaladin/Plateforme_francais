# RECETTE CONTRADICTOIRE FINALE
**Date** : 19 mars 2026, 17:00 UTC+1
**Auditeur** : Claude Opus 4.6
**Méthode** : recette contradictoire stricte — aucun chiffre antérieur réutilisé

---

## 1. Source de vérité actuelle

| Élément | Valeur |
|---------|--------|
| SHA local HEAD | `ab72f7f` |
| SHA origin/main | `ab72f7f` |
| SHA servi en production | `ab72f7f` |
| Build time | 2026-03-19T15:57 |
| Node.js heap | 512 MB (`--max-old-space-size=512`) |
| PM2 eaf-nextjs | online, 0 restart depuis dernier deploy |
| PM2 eaf-mcp | online, bind 127.0.0.1:3100 |
| PM2 eaf-worker | online |
| Redis | PONG, localhost only |
| PostgreSQL | port 5433, healthy |
| RAG API | port 18001, `{"status":"healthy"}` |
| .env permissions | 600 |

**Aucun écart** entre local, distant et production.

---

## 2. Défauts bloquants détectés pendant la recette

### Défaut 1 : Explication orale 0/8 (CRITIQUE)
L'évaluation de la phase EXPLICATION retournait systématiquement score 0 avec « Évaluation indisponible ».

### Défaut 2 : Incohérence descriptif→oral (CRITIQUE)
L'API POST `/api/v1/student/descriptif` sauvegardait dans MemoryEvent (log), pas dans DescriptifTexte (table lue par l'oral). L'API GET n'existait pas. Un élève ne pouvait pas alimenter son oral via le flux normal.

### Défaut 3 : Ressources 404 (CRITIQUE)
Toutes les ressources retournaient 404 car `resolveRessourcePath` ne strippait pas le préfixe `ressources/` du catalogue.

### Défaut 4 : Gating freemium bypassed (CRITIQUE SÉCURITÉ)
Le matching entre path demandé et catalogue échouait (préfixe non normalisé), rendant `matchedResource` toujours undefined. Tout utilisateur FREE pouvait accéder à 100% des ressources.

---

## 3. Cause racine de chaque défaut

### Défaut 1 — Explication 0/8
**Skill** : `coach_explication` (tier `standard`, model `mistral-small-latest`)
**Cause** : Le prompt contenait un « mode écoute/relance » jamais utilisé par l'API. Le LLM interprétait le transcript comme une demande de relance et retournait `{"relance": {"question":"...", "indice":"..."}}` — un objet au lieu d'un string. Le schéma Zod rejetait l'objet (`Expected string, received object`), puis tous les champs requis manquaient → `SCHEMA_VALIDATION` → fallback `{score:0, feedback:"Évaluation indisponible."}`.
**Preuve** : log PM2 `[llm] schema_validation_failure for skill=coach_explication {"relance":{"_errors":["Expected string, received object"]}}`

### Défaut 2 — Descriptif→oral
**Cause** : `src/app/api/v1/student/descriptif/route.ts` contenait uniquement `export { POST } from '@/app/api/v1/student/recapitulatif/route'`. La route recapitulatif log dans MemoryEvent, pas dans DescriptifTexte. L'oral (`src/lib/oral/service.ts:73`) lit `profile.descriptifTextes` depuis la relation Prisma `DescriptifTexte`. La table était toujours vide → `Descriptif incomplet: 3 textes minimum`.

### Défaut 3 — Ressources 404
**Cause** : `route.ts` appelait `resolveRessourcePath(normalizedPath)` qui fait `path.resolve(RESSOURCES_ROOT, normalizedPath)`. Avec `normalizedPath = "ressources/Annales_EAF/..."` → `/srv/eaf_ressources/ressources/Annales_EAF/...` (double préfixe). Le fichier réel est à `/srv/eaf_ressources/Annales_EAF/...`.

### Défaut 4 — Gating bypassed
**Cause** : Le catalogue stocke `url: "/ressources/Cat/file"`. Le matching fait `r.url.replace(/^\/ressources\//, '')` → `Cat/file`. Mais `normalizedPath` = `ressources/Cat/file` (sans strip). `Cat/file` ≠ `ressources/Cat/file` → aucun match → gating non appliqué.

---

## 4. Correctifs appliqués

| # | Fichier | Modification | Commit |
|---|---------|-------------|--------|
| 1 | `src/lib/llm/skills/oral-coach-explication.ts` | Supprimer mode écoute/relance du prompt. Forcer évaluation complète. Schema relance accepte string\|object. | `cc0db7b` |
| 2 | `src/app/api/v1/student/descriptif/route.ts` | Réécrire avec GET + POST opérant sur DescriptifTexte via Prisma (plus d'alias recapitulatif). | `cc0db7b` |
| 3 | `tests/unit/api/descriptif-route.test.ts` | Réécrire pour tester le nouveau GET/POST DescriptifTexte. 5 tests. | `cc0db7b` |
| 4 | `src/app/api/v1/ressources/file/route.ts` | Remplacer `resolveRessourcePath` par `resolveCatalogFilePath` (strip préfixe `ressources/`). | `4d020a6` |
| 5 | `src/app/api/v1/ressources/file/route.ts` | Normaliser `inputPath` dans le matching gating : `normalizedPath.replace(/^ressources\//, '')`. | `ab72f7f` |

---

## 5. Revalidation production connectée

### 5.1 Flux descriptif→oral (sans injection SQL)

| Étape | Action | Résultat |
|-------|--------|---------|
| POST descriptif | 4 textes via API | `{"ok":true,"count":4}` HTTP 200 |
| GET descriptif | Lecture | 4 textes retournés depuis DescriptifTexte |
| DB check | `SELECT count(*) FROM DescriptifTexte` | 4 (cohérent) |
| START oral | `{"oeuvre":"Manon Lescaut"}` | `{"sessionId":"5fd6b70e-..."}` HTTP 200 |

### 5.2 Atelier oral 4/4 phases

| Phase | Score | Max | Provider | Feedback |
|-------|-------|-----|----------|----------|
| LECTURE | 1 | 2 | mistral-small-latest | Bonne compréhension, expressivité à améliorer |
| **EXPLICATION** | **5** | **8** | **mistral-small-latest** | **Structurée en 3 mouvements, bonne progression** |
| GRAMMAIRE | 1.5 | 2 | mistral-small-latest | Identification correcte, interprétation pertinente |
| ENTRETIEN | 4 | 8 | mistral-small-latest | Enjeux cernés, approfondissement demandé |
| **TOTAL** | **11.5** | **20** | | **Mention : Passable** |

L'explication est **corrigée** : score 5/8 au lieu de 0/8.

### 5.3 Bibliothèque

| Test | Résultat |
|------|---------|
| Free Annales idx 0-1 | 200 (2 free sur 27) |
| Locked Annales idx 2-5 | **403** (gating fonctionne) |
| Range request PDF | **206** Partial Content |
| Download `?download=1` | **attachment; filename** |
| Sans auth | **401** |
| Path traversal `../../etc/passwd` | **403** |

### 5.4 Pages HTTP

| Page | Non connecté | Connecté |
|------|-------------|----------|
| `/` | 200 | 200 |
| `/login` | 200 | 200 |
| `/pricing` | 200 | 200 |
| `/dashboard` | 307→login | 200 |
| `/tuteur` | 307→login | 200 |
| `/quiz` | 307→login | 200 |
| `/bibliotheque` | 307→login | 200 |
| `/atelier-oral` | 307→login | 200 |

---

## 6. Résultats des tests

| Suite | Commande | Résultat |
|-------|----------|---------|
| TypeScript | `tsc --noEmit` | **0 erreurs** |
| ESLint | `npm run lint` | **0 erreurs** |
| Vitest | `npx vitest run` | **160 fichiers, 1105 tests, 0 échec** |
| Build | `next build` | **succès** |
| MCP tests | `npm run mcp:test` | **2 fichiers, 15 tests, 0 échec** |
| GitLeaks | `gitleaks detect` | **0 leaks** |

---

## 7. Écarts restants

| # | Écart | Sévérité | Justification |
|---|-------|----------|---------------|
| 1 | E2E Playwright ne tourne pas en local (besoin PostgreSQL+Redis) | Info | Conçu pour CI uniquement. CI Gate 4 = success. |
| 2 | Table WebVital manquante en prod (migration) | Low | Prisma error P2021 dans les logs. Non bloquant (Web Vitals dégradent en silencieux). |
| 3 | Clé Mistral compromise dans historique git | Action requise | Révoquer la clé sur console.mistral.ai et en générer une nouvelle. |
| 4 | Coverage gate CI bas (30%) | Low | Fonctionnel mais fausse sécurité. Relever progressivement. |

---

## 8. Verdict final

### **ÉTAT B — EXPLOITABLE AVEC RÉSERVES EXPLICITES**

**Justification du B (pas A) :**
- La clé Mistral API est compromise dans l'historique git et doit être révoquée/remplacée avant exploitation commerciale.
- La table WebVital manque en production (migration Prisma non appliquée).
- Ces deux points sont corrigeables en moins de 30 minutes mais ne sont pas corrigés à cet instant.

**Ce qui est validé :**
- Atelier oral : 4/4 phases fonctionnelles, explication 5/8 (corrigée de 0/8)
- Flux descriptif→oral : cohérent via DescriptifTexte, sans injection SQL
- Bibliothèque : gating FREE/Premium fonctionne, 403 sur locked, 200 sur free
- Range requests, download, path traversal : OK
- Sécurité : CSP nonce, HSTS, CSRF, rate limit, .env 600, MCP 127.0.0.1
- Tests : 1105/1105, lint 0, build clean
- Production : SHA synchronisé, heap 512MB, RAG healthy
