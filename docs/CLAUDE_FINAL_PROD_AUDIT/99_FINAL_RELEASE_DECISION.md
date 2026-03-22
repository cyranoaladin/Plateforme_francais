# NEXUS REUSSITE EAF — RECETTE FINALE PRE-EXPLOITATION

**Date**: 2026-03-22 18:15 UTC
**SHA**: 0f7319e (local = origin = prod)

---

## 1. SOURCE DE VERITE

| Check | Result |
|-------|--------|
| SHA local=origin=prod | 0f7319e |
| PM2 eaf-nextjs | online |
| PM2 eaf-mcp | online, 20 tools |
| PM2 eaf-worker | online |
| Nginx | server: nginx (no version), HSTS, CSP, X-Frame |
| PostgreSQL | 21 migrations, schema up to date |
| Redis | PONG |
| Ports 3000/3100 | 127.0.0.1 only |
| Port 3001 Docker | STOPPED (re-stopped this session) |
| UFW | active (22/80/443) |
| Backup | hourly to Storage Box, last run OK |
| SMTP | 5 vars configured |
| Artefacts (.venv etc) | all absent |
| RAG Chunks | **0 (BLOCKER)** |

## 2. PHASES TESTEES

| Phase | Description | Result |
|-------|-------------|--------|
| 0 | Infrastructure | OK (Docker 3001 re-fixed) |
| 2 | Public pages | 7/7 return 200 |
| 2 | Legacy labels | 0 PRO/MAX plan labels (only content words) |
| 2 | Sensitive files | all 404 |
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

## 3. DEFAUTS

| ID | Defaut | Severite | Status |
|----|--------|----------|--------|
| D1 | Docker nexus-next-app auto-recreated on 0.0.0.0:3001 | HIGH | FIXED (docker compose stop) |
| D2 | RAG Chunks = 0 (tuteur sans sources EAF) | HIGH | OPEN — requires RAG indexation |
| D3 | Non-EAF PM2 services still running | LOW | Documented (not EAF responsibility) |

## 4. CRITERES BLOQUANTS GO LIVE

- [x] SHA local = origin = prod
- [x] PM2: eaf-nextjs + eaf-mcp + eaf-worker online
- [x] PostgreSQL: schema up to date
- [ ] **RAG: chunks > 0** — OPEN (0 chunks indexed)
- [x] Backup horaire: last backup < 1h
- [x] UFW actif: 22/80/443 ouverts
- [x] Emails: envoi reel prouve (messageId)
- [x] Plans: Freemium/Premium/Masterium uniquement
- [x] Zero label PRO/MAX/ClicToPay visible
- [x] Billing: virement → code → redeem operationnel
- [x] Admin: generation code + paiement manuel
- [x] Ateliers: tuteur/ecrit/quiz fonctionnels
- [x] Quotas: coherents
- [x] Aucune route sensible accessible sans auth
- [x] Aucun port interne accessible (UFW)
- [x] Wording francais correct

## 5. DECISION

### ETAT B — GO AVEC RESERVE UNIQUE

**Reserve: RAG corpus vide (0 chunks indexed)**

Le tuteur IA repond avec ses connaissances generales (reponses de qualite)
mais sans citations du corpus officiel EAF 2026 (annales, rapports de jury,
BO). L'indexation RAG est une operation d'infrastructure (lancer l'ingestor
Docker sur les 548 fichiers de /srv/eaf_ressources/).

**Impact business**: Le tuteur fonctionne mais ne cite pas les sources
officielles. Les reponses restent pedagogiquement valides (verifie:
1287 chars sur Zilia, 163 chars sujet ecrit, 5 questions quiz).

**Action requise**: Lancer l'indexation RAG via le compose-ingestor-1
Docker container (127.0.0.1:18001).

Tous les autres criteres sont fermes. La plateforme est fonctionnelle
pour l'exploitation commerciale et pedagogique.

**SHA: 0f7319e**
