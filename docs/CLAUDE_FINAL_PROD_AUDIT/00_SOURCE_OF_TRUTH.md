# PHASE 0 — SOURCE DE VÉRITÉ

> Audit réalisé le 2026-03-21 ~10:35 UTC+1
> Auditeur: Claude (contre-expertise finale pré-exploitation)

---

## 1. Alignement SHA

| Emplacement | SHA | Date commit | Message |
|-------------|-----|-------------|---------|
| **Local HEAD** | `556faf15450ee715c368eed8e0e86a41a547dc0c` | 2026-03-21 10:12:27 +0100 | feat(landing): Complete conversion-optimized landing page EAF 2026 |
| **origin/main** | `be055c248e12780d0042b0419847821f180bf5de` | antérieur | (2 commits en retard sur local) |
| **Prod (health)** | `556faf1` | build 2026-03-21T09:13:29Z | Correspond au local HEAD |

### ⚠️ DÉFAUT P0-001 — Local ahead of origin/main

Local est **2 commits en avance** sur origin/main :
- `cf79544` — docs: Comprehensive documentation overhaul
- `556faf1` — feat(landing): Complete conversion-optimized landing page

**Impact** : La prod sert du code non poussé sur origin. Le CI GitHub Actions n'a jamais validé ces 2 commits. En cas de perte de la machine locale, ces commits seraient perdus.

**Sévérité** : HAUTE — À pousser immédiatement.

---

## 2. État des services (prod 88.99.254.59)

### PM2

| Process | Status | PID | Uptime | Restarts | Mémoire |
|---------|--------|-----|--------|----------|---------|
| eaf-nextjs | ✅ online | 99921 | ~20min | 17 | 154.6 MB |
| eaf-mcp | ✅ online | 99898 | ~20min | 53 | 75.6 MB |
| eaf-worker | ✅ online | 99915 | ~20min | 78 | 54.6 MB |
| brevet-master | ✅ online | 1064 | 4D | 0 | 63.6 MB |
| journey-web | ✅ online | 1082 | 4D | 0 | 122.5 MB |
| mf-backend | ✅ online | 1090 | 4D | 0 | 58.9 MB |
| mfai-main | ✅ online | 1091 | 4D | 0 | 67.9 MB |

> Les 53/78 restarts de eaf-mcp / eaf-worker sont cumulatifs sur les déploiements successifs (SIGINT → redémarrage propre), pas des crash loops.

### Nginx
- **Status** : active
- **Config** : syntax OK, test successful
- **SSL** : Let's Encrypt, certificat valide pour eaf.nexusreussite.academy
- **Reverse proxy** : → http://eaf_nextjs (upstream vers port 3000)

### Redis
- **Status** : ✅ PONG
- **Bind** : 127.0.0.1:6379 (sécurisé)

### PostgreSQL
- **Version** : PostgreSQL 16.13 (Ubuntu)
- **Base** : eaf_prod sur localhost:5433 (Docker nexus-postgres-db)
- **Status** : UP (healthy)

### RAG (Ingesteur Docker)

| Élément | Résultat |
|---------|----------|
| Container | compose-ingestor-1, Up 26h (healthy) |
| Port | 127.0.0.1:18001 → 8001/tcp |
| /health | ❌ **TIMEOUT** (5s sans réponse) |
| /api/search | ❌ Pas de réponse |
| /api/collections | ❌ Pas de réponse |

### ⚠️ DÉFAUT P0-002 — RAG ingesteur ne répond pas

Le container Docker `compose-ingestor-1` est marqué "healthy" mais **aucun endpoint HTTP ne répond** (timeout sur /health, /api/search, /api/collections). Le service RAG est effectivement **hors service**.

**Impact** : Les citations RAG dans le tuteur, l'oral et les corrections seront absentes ou en fallback. L'expérience IA sera dégradée. Le produit promet "Sources BO & Eduscol garanties" — promesse potentiellement non tenue si le fallback pgvector ne compense pas.

**Sévérité** : HAUTE — Impact direct sur la promesse commerciale.

### MCP Server
- **Status** : online
- **Port** : 3100
- **Transport** : HTTP

### ⚠️ DÉFAUT P0-004 — MCP bind 0.0.0.0:3100

Le serveur MCP écoute sur `0.0.0.0:3100` au lieu de `127.0.0.1:3100`. Il est accessible publiquement depuis Internet.

**Impact** : Surface d'attaque inutile. Le MCP ne devrait être accessible que depuis localhost (via nginx ou le serveur Next.js).

**Sévérité** : MOYENNE — Risque sécurité.

### SMTP
- **Config** : SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS présents dans .env
- **Pas de serveur SMTP local** : utilise un relais externe (Hostinger)
- **Aucun port SMTP en écoute locale** : correct

---

## 3. Prisma / Migrations

```
20 migrations found in prisma/migrations
Database schema is up to date!
```

✅ Aucune migration en attente.

---

## 4. Variables d'environnement

### Présentes (29 clés)

```
DATABASE_URL, DIRECT_URL, EMAIL_FROM, EMAIL_REPLY_TO, HOSTNAME,
LLM_COST_TRACKING, LLM_MULTI_PROVIDER_FALLBACK, LLM_PROVIDER_ORDER,
LLM_ROUTER_ENABLED, LLM_TIMEOUT_MS, MCP_ALLOWED_ORIGINS, MCP_API_KEY,
MCP_HTTP_BIND, MCP_LOG_LEVEL, MCP_PORT, MCP_SERVER_URL, MCP_TRANSPORT,
MISTRAL_API_KEY, NODE_ENV, RAG_API_TOKEN, RAG_API_URL, RAG_COLLECTION,
REDIS_URL, RESSOURCES_ROOT, SMTP_HOST, SMTP_PASS, SMTP_PORT, SMTP_USER
```

### Manquantes analysées

| Variable | Utilisée en runtime ? | Impact |
|----------|----------------------|--------|
| SESSION_SECRET | ❌ Non (sessions = UUID en DB, pas de signing) | Aucun impact runtime |
| CSRF_SECRET | ❌ Non (CSRF = double-submit random token) | Aucun impact runtime |
| BILLING_CODE_PEPPER | ⚠️ Oui, MAIS fallback `eaf-default-pepper-change-me` | **Codes hashés avec pepper par défaut** |
| NEXT_PUBLIC_APP_URL | ⚠️ Oui, fallback `https://eaf.nexusreussite.academy` | Fallback correct, pas de bug |
| GEMINI_API_KEY | Non critique (fallback provider) | LLM fallback indisponible |
| OPENAI_API_KEY | Non critique (fallback provider) | LLM fallback indisponible |
| CLICTOPAY_USERNAME | Non utilisé (paiement manuel au go-live) | Aucun impact |
| CLICTOPAY_PASSWORD | Non utilisé (paiement manuel au go-live) | Aucun impact |

### ⚠️ DÉFAUT P0-003 — BILLING_CODE_PEPPER manquant

`BILLING_CODE_PEPPER` n'est pas dans .env prod. Le code utilise le fallback `eaf-default-pepper-change-me`. Tous les codes d'activation générés/vérifiés utilisent ce pepper par défaut.

**Impact** : Si un attaquant connaît le pepper par défaut (il est dans le code source), il peut précalculer les hashes. De plus, changer le pepper plus tard invaliderait tous les codes existants.

**Sévérité** : MOYENNE — Risque sécurité sur les codes d'activation.

---

## 5. GitHub Actions

| Run | SHA | Status |
|-----|-----|--------|
| Dernier | `be055c2` | ✅ success |

⚠️ Les 2 derniers commits locaux (cf79544, 556faf1) n'ont **jamais été validés par le CI**.

---

## 6. Répertoire de ressources

```
/opt/eaf_platform/ressources/ — 548 fichiers
Sous-dossiers: Annales_EAF, Documents_Extraits, ...
```

✅ Ressources déployées et cohérentes en nombre.

---

## 7. Services legacy / parasites

| Service | Port | Impact sur EAF |
|---------|------|----------------|
| brevet-master | interne | ❌ Aucun |
| journey-web | interne | ❌ Aucun |
| mf-backend | interne | ❌ Aucun |
| mfai-main | interne | ❌ Aucun |
| compose-ollama-1 | 0.0.0.0:11434 | ⚠️ Ollama exposé publiquement |
| nexus-postgres-db | 0.0.0.0:5435 | ⚠️ PostgreSQL EAF exposé publiquement |

### ⚠️ DÉFAUT P0-005 — PostgreSQL EAF exposé sur 0.0.0.0:5435

Le container Docker `nexus-postgres-db` bind sur `0.0.0.0:5435`. La base de données EAF est **accessible depuis Internet** sur le port 5435.

**Sévérité** : **CRITIQUE** — Accès direct à la base de données de production depuis Internet.

### ⚠️ DÉFAUT P0-006 — Ollama exposé sur 0.0.0.0:11434

Le container Ollama bind sur `0.0.0.0:11434`. Quiconque peut envoyer des requêtes LLM.

**Sévérité** : MOYENNE — Abus de ressources possible.

---

## 8. Binds réseau sensibles

| Port | Service | Bind | Sécurisé ? |
|------|---------|------|-----------|
| 80/443 | Nginx | 0.0.0.0 | ✅ Normal |
| 22 | SSH | 0.0.0.0 | ✅ Normal |
| 3000 | Next.js | 0.0.0.0 | ⚠️ Devrait être 127.0.0.1 |
| 3100 | MCP | 0.0.0.0 | ⚠️ DÉFAUT P0-004 |
| 5433 | PG (natif) | 127.0.0.1 | ✅ OK |
| 5435 | PG (Docker EAF) | 0.0.0.0 | ❌ DÉFAUT P0-005 |
| 6379 | Redis | 127.0.0.1 | ✅ OK |
| 11434 | Ollama | 0.0.0.0 | ⚠️ DÉFAUT P0-006 |
| 18001 | RAG | 127.0.0.1 | ✅ OK (mais ne répond pas) |

---

## 9. Disque et mémoire

| Ressource | Valeur |
|-----------|--------|
| Disque | 929 GB total, 114 GB utilisé (13%) |
| RAM | 62 GB total, 52 GB disponible |

✅ Pas de contrainte ressource.

---

## RÉSUMÉ DES DÉFAUTS PHASE 0

| ID | Sévérité | Description | Corrigible par moi ? |
|----|----------|-------------|---------------------|
| P0-001 | HAUTE | Local 2 commits ahead of origin/main | ✅ Oui (git push) |
| P0-002 | HAUTE | RAG ingesteur ne répond pas (timeout) | ⚠️ Diagnostic Docker nécessaire |
| P0-003 | MOYENNE | BILLING_CODE_PEPPER manquant, pepper par défaut | ✅ Oui (ajouter à .env) |
| P0-004 | MOYENNE | MCP bind 0.0.0.0:3100 | ✅ Oui (config MCP_HTTP_BIND) |
| P0-005 | **CRITIQUE** | PostgreSQL EAF exposé 0.0.0.0:5435 | ⚠️ Modifier docker-compose |
| P0-006 | MOYENNE | Ollama exposé 0.0.0.0:11434 | ⚠️ Modifier docker-compose |
