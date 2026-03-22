# PHASE 0 — SOURCE DE VÉRITÉ ABSOLUE

> **Audit frais réalisé le 2026-03-22 ~12:27 UTC+1**
> Auditeur : Claude (contre-expertise finale intégrale pré-exploitation)
> SHA de référence : `9e386b514025711d4b42acf99ae3b819373defc8`

---

## 1. Alignement SHA

| Emplacement | SHA complet | Preuve |
|-------------|-------------|--------|
| **Local HEAD** | `9e386b514025711d4b42acf99ae3b819373defc8` | `git rev-parse HEAD` |
| **origin/main** | `9e386b514025711d4b42acf99ae3b819373defc8` | `git fetch origin && git rev-parse origin/main` |
| **Prod (health)** | `9e386b5` | `curl /api/v1/health → release.gitSha` |

✅ **SHA local = origin = prod** — Aucune divergence.

- **Commit** : `fix(email): remove orphan logo_email.png, fix createUser type casts`
- **Date** : 2026-03-22 12:13:20 +0100
- **Working tree** : propre (`git status --short` → vide)

---

## 2. Build prod

| Champ | Valeur |
|-------|--------|
| `release.buildTime` | `2026-03-22T11:13:50Z` |
| `release.nodeEnv` | `production` |
| `checks.db` | `ok` |
| `checks.app` | `ok` |

✅ Build cohérent avec le SHA.

---

## 3. PM2 — État des services

| Process | pm_id | Status | Restarts |
|---------|-------|--------|----------|
| **eaf-nextjs** | 34 | ✅ online | 37 |
| **eaf-mcp** | 35 | ✅ online | 37 |
| **eaf-worker** | 36 | ✅ online | 37 |
| brevet-master | 1 | online | 0 |
| journey-web | 3 | online | 0 |
| mf-backend | 4 | online | 0 |
| mfai-main | 5 | online | 0 |
| pm2-logrotate | 32 | online | 3 |

✅ 3 services EAF online, 0 errored.
> Les 37 restarts sont cumulatifs sur les déploiements successifs (SIGINT → redémarrage propre), pas des crash loops.

⚠️ **NOTE** : 4 services legacy non-EAF tournent encore (brevet-master, journey-web, mf-backend, mfai-main). Pas d'impact EAF mais consommation mémoire inutile.

---

## 4. Nginx

| Vérification | Résultat |
|-------------|----------|
| `systemctl is-active nginx` | ✅ `active` |
| `nginx -t` | ✅ `syntax is ok`, `test is successful` |
| Rate-limit zone `eaf_api` | `30r/s` |
| Rate-limit zone `eaf_login` | `5r/m` |

✅ Nginx actif, config valide, rate-limit configuré.

---

## 5. Redis

| Vérification | Résultat |
|-------------|----------|
| `redis-cli ping` | ✅ `PONG` |
| Version | `7.0.15` |
| Bind | `127.0.0.1:6379` |

✅ Redis opérationnel et sécurisé.

---

## 6. PostgreSQL

| Vérification | Résultat |
|-------------|----------|
| Base | `eaf_prod` sur `localhost:5433` |
| Migrations | 21 trouvées, **schema up to date** |
| Tables | 36 tables dans le schéma `public` |

✅ 0 migration pending, 0 migration failed.

---

## 7. RAG / Embeddings

| Vérification | Résultat |
|-------------|----------|
| Ingestor `/health` | ✅ `{"status":"healthy"}` |
| ChromaDB heartbeat | ✅ Réponse (v2 API) |
| Table `Chunk` PostgreSQL | ❌ **COUNT = 0** |
| ChromaDB `/api/v2/collections` | ❌ **Vide** |

### ⚠️ DÉFAUT P0-001 — RAG sans embeddings

Le service RAG (ingestor + ChromaDB) est **opérationnel** mais **aucun document n'a été ingéré**. La table `Chunk` est vide (0 lignes), les collections ChromaDB sont vides.

**Impact** : Les citations RAG dans le tuteur, l'oral et les corrections seront absentes. La promesse "Sources BO & Eduscol garanties" est potentiellement non tenue.

**Sévérité** : **HAUTE** — Impact direct sur la qualité pédagogique et la promesse commerciale.

**Corrigible par moi ?** : ⚠️ Nécessite l'exécution du pipeline d'ingestion sur le corpus /srv/eaf_ressources/.

---

## 8. MCP Server

| Vérification | Résultat |
|-------------|----------|
| `/api/mcp/health` | ✅ `{"status":"healthy"}` |
| `mcpVersion` | `1.0.0` |
| `tools` | **20** |
| `latencyMs` | 11 |

✅ MCP healthy, toolCount = 20 > 0.

### ⚠️ DÉFAUT P0-002 — MCP bind 0.0.0.0:3100

Le serveur MCP écoute sur `0.0.0.0:3100` (accessible publiquement).

**Sévérité** : MOYENNE — Surface d'attaque inutile.

---

## 9. SMTP

| Vérification | Résultat |
|-------------|----------|
| `SMTP_HOST` | `smtp.hostinger.com` |
| `SMTP_PORT` | `587` |
| Connexion TCP 587 | ✅ `connect OK` |
| Connexion TCP 465 | ❌ `timeout` |
| Derniers logs emails | ✅ `Email envoyé avec succès` (messageId confirmé) |

✅ SMTP opérationnel sur port 587.

---

## 10. Variables d'environnement critiques

| Variable | Présente ? |
|----------|-----------|
| `NODE_ENV=production` | ✅ |
| `BILLING_CODE_PEPPER` | ✅ |
| `RESSOURCES_ROOT=/srv/eaf_ressources` | ✅ |
| `DATABASE_URL` | ✅ |
| `SMTP_HOST/PORT/USER/PASS` | ✅ |
| `MCP_API_KEY` | ✅ |

✅ Toutes les variables critiques présentes.

---

## 11. Binds réseau

| Port | Service | Bind | Sécurisé ? |
|------|---------|------|-----------|
| 3000 | Next.js | **127.0.0.1** | ✅ |
| 5432 | PG (Docker) | **127.0.0.1** | ✅ |
| 5433 | PG (natif) | **127.0.0.1** | ✅ |
| 5435 | PG (Docker EAF) | **127.0.0.1** | ✅ |
| 6379 | Redis | **127.0.0.1** | ✅ |
| 3100 | MCP | **0.0.0.0** | ⚠️ DÉFAUT P0-002 |
| 11434 | Ollama | **0.0.0.0** | ⚠️ DÉFAUT P0-003 |

✅ Ports 3000, 5432, 5433, 5435, 6379 : fermés publiquement.
⚠️ Ports 3100 et 11434 exposés.

### ⚠️ DÉFAUT P0-003 — Ollama exposé sur 0.0.0.0:11434

**Sévérité** : MOYENNE — Abus de ressources LLM possible depuis Internet.

---

## 12. GitHub Actions

| Run | SHA | Status | Conclusion |
|-----|-----|--------|------------|
| Dernier | `9e386b5` | **in_progress** | — |

⚠️ Le CI est en cours pour le SHA prod. Pas encore `completed success`.

---

## 13. Processus et santé système

| Vérification | Résultat |
|-------------|----------|
| Zombie processes | ✅ **0** |
| Stale worktrees | Présentes mais inactives |

✅ Aucun processus zombie.

---

## 14. Ressources pédagogiques

| Vérification | Résultat |
|-------------|----------|
| `RESSOURCES_ROOT` | `/srv/eaf_ressources` |
| Catégories | `Annales_EAF`, `Documents_Extraits`, `eaf_rapport_jury`, `Oeuvres`, `Videos` |
| Total fichiers | **548** |

✅ Répertoire ressources accessible et non vide.

---

## 15. Logos email

| URL | Status |
|-----|--------|
| `/images/logo_slogan_nexus_email.png` | ✅ **HTTP 200** (21 442 octets, image/png) |
| `/images/logo_email.png` (orphelin) | ✅ **HTTP 404** (supprimé) |

✅ Logo actif accessible, ancien logo orphelin supprimé.

---

## 16. En-têtes de sécurité HTTP

| En-tête | Valeur |
|---------|--------|
| `strict-transport-security` | ✅ `max-age=63072000; includeSubDomains; preload` |
| `x-frame-options` | ✅ `DENY` |
| `x-content-type-options` | ✅ `nosniff` |
| `referrer-policy` | ✅ `strict-origin-when-cross-origin` |
| `permissions-policy` | ✅ `camera=(), microphone=(self), geolocation=()` |
| `content-security-policy` | ✅ Présent (default-src 'self', frame-ancestors 'none') |

✅ Tous les en-têtes de sécurité présents.

---

## RÉSUMÉ DES DÉFAUTS PHASE 0

| ID | Sévérité | Description | Corrigible par moi ? |
|----|----------|-------------|---------------------|
| P0-001 | **HAUTE** | RAG sans embeddings (Chunk=0, ChromaDB vide) | ⚠️ Nécessite pipeline d'ingestion |
| P0-002 | MOYENNE | MCP bind 0.0.0.0:3100 | ✅ Oui (MCP_HTTP_BIND dans .env) |
| P0-003 | MOYENNE | Ollama exposé 0.0.0.0:11434 | ⚠️ Modifier docker-compose |

### Défauts corrigés depuis l'audit précédent (2026-03-21)

| Ancien ID | Description | Statut |
|-----------|-------------|--------|
| P0-001 (ancien) | Local ahead of origin | ✅ CORRIGÉ — SHA aligné |
| P0-003 (ancien) | BILLING_CODE_PEPPER manquant | ✅ CORRIGÉ — Présent en prod |
| P0-005 (ancien) | PostgreSQL 5435 exposé 0.0.0.0 | ✅ CORRIGÉ — Bind 127.0.0.1 |
| Port 3000 | Next.js exposé 0.0.0.0 | ✅ CORRIGÉ — Bind 127.0.0.1 |
