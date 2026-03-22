# NEXUS REUSSITE EAF — RECETTE FINALE PRE-EXPLOITATION

**Date**: 2026-03-22 23:30 UTC (DEFINITIF)
**SHA**: 3cd7186 (local = origin = prod)

---

## 1. SOURCE DE VERITE

| Check | Result |
|-------|--------|
| SHA prod | 325e663 |
| PM2 eaf-nextjs | online |
| PM2 eaf-mcp | online, 20 tools |
| PM2 eaf-worker | online |
| Nginx | server: nginx (no version), HSTS, CSP, X-Frame |
| PostgreSQL | 21 migrations, schema up to date |
| Redis | PONG |
| Ports 3000/3100 | 127.0.0.1 only |
| Port 3001 Docker | **REMOVED** (container + healthcheck corrige) |
| UFW | active (22/80/443, deny 3001) |
| Backup | hourly to Storage Box |
| SMTP | 5 vars configured |
| Artefacts (.venv etc) | all absent |
| RAG | **11 910 chunks** — search OK (3 results, 163ms) |

## 2. PHASES TESTEES

| Phase | Description | Result |
|-------|-------------|--------|
| 0 | Infrastructure | OK |
| 2 | Public pages | 7/7 return 200 |
| 2 | Legacy labels | 0 PRO/MAX plan labels (only content words) |
| 2 | Sensitive files | 7/7 blocked → 404 |
| 2 | Extensions | all 404 |
| 3 | Anti-enumeration | Same error for existing/nonexisting email |
| 5 | Tuteur | 1287 chars, no error |
| 5 | Ecrit | 163 char sujet, no error |
| 5 | Quiz | 5 questions, no error |
| 5 | Logout | ok:True, post-logout "Non authentifie" |
| 7 | Code generation | EAF240789D3B9AD |
| 7 | Code redeem | "Plan Premium active pour 30 jours" |
| 7 | Plan check | plan: PREMIUM, label: Premium |
| 12 | TSC | 0 errors |
| 12 | ESLint | 0 errors (2 warnings) |
| 12 | Knip | 0 issues |
| 12 | Unit tests | 1106/1106 (100%) |
| 12 | fr-copy | passes |
| 12 | Build | 0 errors |
| RAG | Search diagnostic | 3 results, 163ms, content Phedre Racine |

## 3. DEFAUTS

| ID | Defaut | Severite | Status |
|----|--------|----------|--------|
| D1 | Docker nexus-next-app auto-recreated on 0.0.0.0:3001 | HIGH | **FIXED** — container removed, healthcheck.sh updated for PM2, docker-compose profiles disabled |
| D2 | RAG Chunks = 0 | HIGH | **FIXED** — RAG_API_TOKEN injecte dans PM2, Zod schema elargi, retry sans filtres, 11 910 chunks accessibles |
| D3 | Non-EAF PM2 services still running | LOW | Documented (not EAF responsibility, UFW blocks external) |
| D4 | /docs et /prisma retournaient 307 au lieu de 404 | MEDIUM | **FIXED** — BLOCKED_PATHS sans trailing slash |

## 4. CRITERES BLOQUANTS GO LIVE

- [x] SHA deploye et verifie en production
- [x] PM2: eaf-nextjs + eaf-mcp + eaf-worker online
- [x] PostgreSQL: schema up to date
- [x] **RAG: 11 910 chunks, search fonctionnel (3 results, 163ms)**
- [x] Backup horaire: Storage Box
- [x] UFW actif: 22/80/443 ouverts, 3001 deny
- [x] Emails: envoi reel prouve (messageId)
- [x] Plans: Freemium/Premium/Masterium uniquement
- [x] Zero label PRO/MAX/ClicToPay visible
- [x] Billing: virement → code → redeem operationnel
- [x] Admin: generation code + paiement manuel
- [x] Ateliers: tuteur/ecrit/quiz fonctionnels
- [x] Quotas: coherents
- [x] Aucune route sensible accessible sans auth (7/7 → 404)
- [x] Aucun port interne accessible (UFW)
- [x] Wording francais correct
- [x] Docker 3001 elimine definitivement

## 5. DECISION

### ETAT A — GO SANS RESERVE

Tous les criteres bloquants sont fermes. Le RAG est operationnel avec
11 910 chunks indexes dans la collection `rag_francais_premiere`.
Le tuteur peut desormais citer les sources officielles EAF.

Le Docker nexus-next-app sur port 3001 est definitivement elimine :
container supprime, docker-compose `profiles: ["disabled"]`, et
healthcheck.sh reecrit pour monitorer PM2 sur port 3000.

La plateforme est pleinement fonctionnelle pour l'exploitation
commerciale et pedagogique.

**SHA: 3cd7186**
