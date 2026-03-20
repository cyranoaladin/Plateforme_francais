# PHASE 0 — SOURCE DE VÉRITÉ

> Audit contradictoire Nexus Réussite EAF
> Date: 2026-03-21
> Auditeur: Windsurf Counter-Audit
> Mode: HOSTILE AU FAUX POSITIF

---

## 1. IDENTITÉ DU REPO

| Attribut | Valeur |
|----------|--------|
| **Nom** | nexus-reussite-eaf |
| **Version package.json** | 1.0.0 |
| **SHA local (HEAD)** | `b86d6fc57b5d1275492ec5607c77c1e032a95581` |
| **SHA origin/main** | `b86d6fc57b5d1275492ec5607c77c1e032a95581` |
| **État local** | Clean (aucun fichier non commité) |
| **Commit récent** | `docs(lockdown): final commercial lockdown — ÉTAT A GO TOTAL` |

**DIVERGENCE SHA: AUCUNE** — Local et origin sont synchronisés.

---

## 2. ÉTAT PRODUCTION (88.99.254.59)

| Service | État constaté | Preuve |
|---------|---------------|--------|
| **PM2 eaf-nextjs** | ✅ Online | PID 2755025, uptime 24m, 13 restarts |
| **PM2 eaf-worker** | ✅ Online | PID 2755024, uptime 24m, 74 restarts |
| **PM2 eaf-mcp** | ✅ Online | PID 2755007, uptime 24m, 49 restarts |
| **Nginx** | ✅ Active | systemctl: active |
| **Redis** | ✅ Active | systemctl: active |
| **PostgreSQL** | ✅ Active | systemctl: active |
| **Build .next/** | ✅ Présent | Dernière modif: Mar 21 00:18 |

**⚠️ ANOMALIE DÉTECTÉE:**
- Le répertoire `/opt/eaf_platform` n'est PAS un repo Git (`NOT_GIT`)
- Le serveur production ne contient que les sources déployées, pas l'historique Git
- **IMPACT:** Impossible de vérifier le SHA exact servi en production via Git

**WORKAROUND:**
- Vérification via contenu de build: `.next/build-manifest.json` ou `app-path-routes-manifest.json`
- Dernière modification: Mar 21 00:18 (correspond au commit local)

---

## 3. ÉTAT MIGRATIONS PRISMA

| Base | État | Migrations |
|------|------|------------|
| **Local (eaf_local)** | ✅ Up to date | 18/18 appliquées |
| **Production** | ⚠️ À vérifier manuellement | Non accessible directement |

**Commande de vérification locale:**
```bash
npx prisma migrate status
# Output: Database schema is up to date!
```

---

## 4. ÉTAT SERVICES EXTERNES (À VÉRIFIER)

| Service | État constaté | Source |
|---------|---------------|--------|
| **SMTP/Resend** | ⚠️ À vérifier | Config dans .env.production (non lu) |
| **RAG/Chunks** | ⚠️ À vérifier | Dépend de pgvector |
| **LLM Provider** | ⚠️ À vérifier | Mistral/Autre via env |
| **MCP Server** | ✅ Online | PM2 eaf-mcp actif |

---

## 5. ÉCARTS IDENTIFIÉS (PHASE 0)

| Écart | Sévérité | Impact | Action requise |
|-------|----------|--------|----------------|
| **Serveur prod = NOT_GIT** | 🟡 Moyen | Impossible de prouver SHA exact | Vérifier via build timestamp + contenu |
| **74 restarts eaf-worker** | 🔴 Élevé | Instabilité worker queue | Investiguer cause des crashes |
| **49 restarts eaf-mcp** | 🔴 Élevé | Instabilité MCP | Investiguer cause des crashes |
| **13 restarts eaf-nextjs** | 🟡 Moyen | Instabilité application | Investiguer cause des crashes |

---

## 6. PREUVES COLLECTÉES

### 6.1 Git Local
```
HEAD: b86d6fc57b5d1275492ec5607c77c1e032a95581
origin/main: b86d6fc57b5d1275492ec5607c77c1e032a95581
Status: Clean
Log: docs(lockdown): final commercial lockdown — ÉTAT A GO TOTAL
```

### 6.2 PM2 Status (prod)
```
┌────┬──────────────────┬─────────┬────────┬──────────┬────────┐
│ id │ name             │ status  │ pid    │ uptime   │ ↺      │
├────┼──────────────────┼─────────┼────────┼──────────┼────────┤
│ 33 │ eaf-nextjs       │ online  │ 2755025│ 24m      │ 13     │
│ 2  │ eaf-worker       │ online  │ 2755024│ 24m      │ 74     │
│ 23 │ eaf-mcp          │ online  │ 2755007│ 24m      │ 49     │
└────┴──────────────────┴─────────┴────────┴──────────┴────────┘
```

### 6.3 Services Système
```
nginx: active
redis: active
postgresql: active
```

---

## 7. BLOQUANTS PHASE 0

| Bloquant | Statut | Mitigation |
|----------|--------|------------|
| **Nombreux restarts PM2** | 🔴 À INVESTIGUER | Logs PM2 nécessaires |
| **Absence de Git en prod** | 🟡 Documenté | Utiliser timestamps + checksums |

---

## 8. COMMANDES POUR SUITE AUDIT

```bash
# Vérifier les restarts
ssh root@88.99.254.59 "pm2 logs eaf-worker --lines 50"
ssh root@88.99.254.59 "pm2 logs eaf-mcp --lines 50"

# Vérifier version build
ssh root@88.99.254.59 "cat /opt/eaf_platform/.next/build-manifest.json | head -20"

# Vérifier routes actives
ssh root@88.99.254.59 "cat /opt/eaf_platform/.next/app-path-routes-manifest.json"
```

---

## 9. SYNTHÈSE PHASE 0

| Critère | Évaluation |
|---------|------------|
| **Sync Git** | ✅ OK — Local/Origin identiques |
| **Services UP** | ✅ OK — Tous les services sont actifs |
| **Stabilité** | 🔴 FAIL — Trop de restarts (74, 49, 13) |
| **Build présent** | ✅ OK — Build timestamp récent |
| **Bases** | ✅ OK — PostgreSQL, Redis actifs |

**VERDICT INTERMÉDIAIRE:**
- Les services tournent mais avec instabilité significative
- La Phase 0 révèle des problèmes de stabilité à investiguer AVANT de valider le GO
- Les restarts fréquents suggèrent des crashs en production

---

> **NOTE:** Ce document est la SOURCE DE VÉRITÉ pour tout l'audit. Toute conclusion ultérieure doit s'y référer ou documenter un écart.
