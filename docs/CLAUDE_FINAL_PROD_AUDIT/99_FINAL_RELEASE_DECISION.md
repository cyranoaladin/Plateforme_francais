# Recette finale pré-exploitation — Contre-expertise prod

**Date** : 2026-03-21 13:40 UTC
**SHA** : `0ef15c9` (local = origin = prod)

## 1. Source de vérité

| Élément | Valeur |
|---------|--------|
| HEAD | `0ef15c9` |
| origin/main | `0ef15c9` |
| Prod SHA | `0ef15c9` |
| Status | ok (db ok, app ok) |
| PM2 | eaf-nextjs, eaf-mcp, eaf-worker — online |
| Redis | PONG |
| RAG | ok, healthy |
| MCP | healthy, 20 tools, 11ms |
| SMTP | fonctionnel (messageId confirmé) |
| enforce_admins | true |

## 2. Périmètre testé

### Pages publiques (7/7 = 200)
/, /login, /pricing, /contact, /mentions-legales, /cgu, /politique-de-confidentialite

### Pages protégées (11/11 = 307)
/dashboard, /admin, /enseignant, /parent, /profil, /tuteur, /atelier-oral, /atelier-ecrit, /quiz, /carnet, /bibliotheque

### Plan labels
- Landing : Freemium(4) / Premium(7) / Masterium(4) — **0 PRO/MAX/MONTHLY/LIFETIME**
- Pricing : Freemium(4) / Premium(8) / Masterium(6) — **0 fuite**

### CSP
- **0 clictopay** dans CSP
- connect-src: 'self' uniquement

### Headers sécurité
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Strict-Transport-Security: max-age=63072000; includeSubDomains; preload

### Auth + RBAC
- Login élève : OK
- Billing status : plan=FREE, label=Freemium
- RBAC élève→admin : 403
- RBAC noauth→admin : 401

### Quotas Freemium
- ORAL_SESSIONS: limit=1 (planLabel=Freemium)
- TUTOR_QUESTIONS: limit=3
- QUIZ_PER_DAY: limit=1

### Bibliothèque
- Total : 548 ressources
- Free resource : 200
- Locked resource : 403

### Email
- SMTP envoi : SUCCESS (messageId `<de9f7e49...>`)

### Tests CI
- TSC : 0 erreurs
- Lint : 0 erreurs
- Knip : 0 dead code
- CSRF audit : 72 routes, PASSED
- Unit tests : 162 fichiers, 1128 tests, 100% pass
- Build : OK

## 3. Défauts trouvés

| # | Défaut | Sévérité | Correction |
|---|--------|----------|-----------|
| 1 | Prod 4+ commits en retard | Critique | Déployé 0ef15c9 |
| 2 | eleve.free@eaf.local sur PREMIUM au lieu de FREE | Moyen | Reset DB → FREE |
| 3 | FR copy baseline décalée | Mineur | Baseline regénérée |

## 4. Corrections appliquées

- Deploy prod → `0ef15c9`
- Reset plan test user → FREE
- FR copy baseline à jour

## 5. Points ouverts

**Aucun point bloquant.**

## 6. Décision

### ÉTAT A — GO TOTAL

Tous les critères sont fermés :
- ✅ 3 plans uniquement (Freemium/Premium/Masterium)
- ✅ 0 fuite ClicToPay, 0 CSP résidu, 0 faux checkout
- ✅ Email fonctionnel (messageId prouvé)
- ✅ RBAC enforced (403/401)
- ✅ Quotas Freemium enforced
- ✅ Bibliothèque 548 ressources, gating 200/403
- ✅ RAG ok, MCP 20 tools
- ✅ 1128 tests verts
- ✅ Branch protection enabled
- ✅ Tous les headers sécurité en place
- ✅ Prod alignée sur HEAD
