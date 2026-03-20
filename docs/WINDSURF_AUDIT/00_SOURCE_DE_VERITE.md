# 00 — SOURCE DE VERITE

**Date :** 2026-03-20
**Heure :** ~00:12 UTC
**Auditeur :** Claude Opus 4.6 (automatise)
**Branche auditee :** main

---

## 1. Git / Repository

| Element              | Valeur                                                       |
|----------------------|--------------------------------------------------------------|
| Branche              | `main`                                                       |
| HEAD local           | `f0aa301`                                                    |
| origin/main          | `f0aa301`                                                    |
| Working tree         | clean (2 fichiers commites juste avant le deploy)            |
| 5 derniers commits   | `f0aa301`, `78eb99d`, `94f2d8b`, `c073da2`, `481c1e3`       |

---

## 2. Build servi en production

| Point de controle       | SHA        | Aligne ? |
|-------------------------|------------|----------|
| SHA local               | `f0aa301`  | OUI      |
| SHA origin/main         | `f0aa301`  | OUI      |
| SHA serveur (health)    | `f0aa301`  | OUI      |

| Metadata     | Valeur                    |
|--------------|---------------------------|
| buildTime    | `2026-03-20T00:11:26Z`    |
| nodeEnv      | `production`              |

**Verdict : ALIGNED — local = origin = prod**

Le SHA expose par le endpoint `/api/health` correspond exactement au HEAD du repository.

---

## 3. Infrastructure de production

### 3.1 Reverse proxy — Nginx

| Element | Valeur                  |
|---------|-------------------------|
| Config  | syntax ok, running      |
| Ports   | 80 (HTTP), 443 (HTTPS)  |

### 3.2 PM2 (process manager)

| Processus   | PID       | Statut  | Notes                        |
|-------------|-----------|---------|-------------------------------|
| eaf-nextjs  | 3494907   | online  |                               |
| eaf-mcp     | 3494889   | online  |                               |
| eaf-worker  | 3494901   | online  | 36 restarts (voir section 5)  |

### 3.3 Docker containers

| Container            | Statut         |
|----------------------|----------------|
| nexus-postgres-db    | healthy        |
| compose-ingestor-1   | **UNHEALTHY**  |
| compose-chroma-1     | healthy        |
| compose-ollama-1     | healthy        |
| docker-redis-1       | healthy        |
| + autres services    | —              |

### 3.4 Bases de donnees et cache

| Service     | Adresse            | Notes                          |
|-------------|---------------------|--------------------------------|
| PostgreSQL  | localhost:5432      | via Docker (nexus-postgres-db) |
| PostgreSQL  | localhost:5433      | eaf_prod via Docker            |
| Redis       | localhost:6379      | PONG (operationnel)            |

### 3.5 Securite et ressources systeme

| Element          | Valeur                              |
|------------------|--------------------------------------|
| .env permissions | `-rw-------` root:root (600)         |
| Disque           | 929G total, 109G utilise (13%)       |
| Memoire          | 62Gi total, 7.2Gi utilise, 55Gi disponible |
| Swap             | 8Gi total, 3.2Mi utilise             |

---

## 4. Services applicatifs

| Service         | Detail                                                           |
|-----------------|------------------------------------------------------------------|
| Next.js         | online, port 3000 (standalone mode)                              |
| App dir         | `/opt/eaf_platform` (rsync deploy target)                        |
| Standalone      | `/opt/eaf_platform/.next/standalone`                             |
| Legacy clone    | `/var/www/eaf` (git clone, **NON utilise** par PM2)              |
| Ressources      | `/opt/eaf_platform/ressources` -> `/srv/eaf_ressources` (symlink)|
| MCP server      | PM2 `eaf-mcp`, online                                           |

---

## 5. Problemes identifies

| # | Severite | Description                                                                                  |
|---|----------|----------------------------------------------------------------------------------------------|
| 1 | WARN     | `compose-ingestor-1` est UNHEALTHY (RAG ingestor). Probleme connu des audits precedents.     |
| 2 | INFO     | `/var/www/eaf` est un ancien clone git non utilise par PM2. A documenter ou supprimer.       |
| 3 | WARN     | `eaf-worker` a accumule 36 restarts. A surveiller pour identifier la cause racine.           |

---

## 6. Conclusion

**Source : ALIGNED**

Le SHA du commit HEAD local (`f0aa301`), du remote origin/main (`f0aa301`) et du serveur de production (`f0aa301` via `/api/health`) sont identiques. Le build servi en production correspond exactement au code source du repository.

Les trois problemes identifies sont mineurs ou connus et ne compromettent pas l'integrite du deploiement. Le RAG ingestor unhealthy est un probleme recurrent deja documente. Le nombre eleve de restarts du worker necessite une surveillance.

---

*Document genere lors de l'audit du 2026-03-20 ~00:12 UTC.*
