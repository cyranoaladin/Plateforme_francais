# MATRICE ENVIRONNEMENT PRODUCTION - NEXUS EAF

**Version:** 1.0.0  
**Date:** 2026-04-12  
**Statut:** CANONIQUE

---

## 🔴 VARIABLES OBLIGATOIRES - CORE

| Variable | Scope | Format | Génération | Impact si absente | Exemple production |
|----------|-------|--------|------------|-------------------|-------------------|
| `NODE_ENV` | All | `production` | Static | Crash | `production` |
| `PORT` | Web | `3000` | Static | Default 3000 | `3000` |
| `MCP_PORT` | MCP | `3100` | Static | Default 3100 | `3100` |
| `NEXT_PUBLIC_APP_URL` | Web | `https://...` | Static | URLs cassées | `https://eaf.nexusreussite.academy` |
| `APP_ROOT` | All | `/opt/eaf/current` | Static | Chemins relatifs | `/opt/eaf/current` |

---

## 🔴 VARIABLES OBLIGATOIRES - SÉCURITÉ

| Variable | Scope | Format | Génération | Vérification | Commande génération |
|----------|-------|--------|------------|--------------|---------------------|
| `SESSION_SECRET` | All | 64 chars base64 | `openssl rand -base64 32` | Length >= 32 | `openssl rand -base64 32` |
| `CSRF_SECRET` | All | 64 chars base64 | `openssl rand -base64 32` | Length >= 32 | `openssl rand -base64 32` |
| `CRON_SECRET` | All | 64 chars base64 | `openssl rand -base64 32` | Length >= 32 | `openssl rand -base64 32` |
| `BILLING_CODE_PEPPER` | All | 64 chars hex | `openssl rand -hex 32` | Length >= 32 | `openssl rand -hex 32` |
| `MCP_API_KEY` | Web/MCP | 64 chars hex | `openssl rand -hex 32` | Length >= 32 | `openssl rand -hex 32` |

**Stockage:** `/opt/eaf/secrets/.env.production` (chmod 600, owner eaf:eaf)

---

## 🔴 VARIABLES OBLIGATOIRES - BASE DE DONNÉES

| Variable | Scope | Format | Source | Exemple |
|----------|-------|--------|--------|---------|
| `DATABASE_URL` | All | `postgresql://user:pass@host:port/db` | PostgreSQL | `postgresql://eaf:eaf_pass@localhost:5432/eaf_prod` |
| `DIRECT_URL` | All | `postgresql://user:pass@host:port/db` | PostgreSQL | Identique à DATABASE_URL si pas de pooler |

**Note:** En production avec PgBouncer, DIRECT_URL doit pointer vers l'instance directe.

---

## 🟡 VARIABLES OBLIGATOIRES - LLM (au moins un provider)

| Variable | Scope | Format | Source | Condition |
|----------|-------|--------|--------|-----------|
| `MISTRAL_API_KEY` | All | `sk-...` | Mistral AI Console | Si Mistral utilisé |
| `GEMINI_API_KEY` | All | `AI...` | Google AI Studio | Si Gemini utilisé |
| `OPENAI_API_KEY` | All | `sk-...` | OpenAI Platform | Si OpenAI utilisé |

**Validation:** Au moins une des trois clés doit être présente ET non vide.

---

## 🟡 VARIABLES RECOMMANDÉES - LLM CONFIG

| Variable | Scope | Valeur par défaut | Description |
|----------|-------|-------------------|-------------|
| `LLM_ROUTER_ENABLED` | All | `true` | Active le routage multi-provider |
| `LLM_PROVIDER_ORDER` | All | `gemini,openai,mistral` | Ordre de fallback |
| `LLM_TIMEOUT_MS` | All | `30000` | Timeout requêtes LLM |
| `LLM_MULTI_PROVIDER_FALLBACK` | All | `true` | Active fallback sur échec |

---

## 🟡 VARIABLES RECOMMANDÉES - RAG

| Variable | Scope | Valeur par défaut | Description |
|----------|-------|-------------------|-------------|
| `RAG_API_URL` | All | `http://127.0.0.1:18001` | URL service RAG |
| `RAG_API_TOKEN` | All | - | Token auth RAG (si requis) |
| `RAG_TIMEOUT_MS` | All | `8000` | Timeout requêtes RAG |

---

## 🟡 VARIABLES RECOMMANDÉES - EMAIL

| Variable | Scope | Valeur par défaut | Exemple |
|----------|-------|-------------------|---------|
| `SMTP_HOST` | Web/Worker | - | `smtp.hostinger.com` |
| `SMTP_PORT` | Web/Worker | `587` | `587` |
| `SMTP_USER` | Web/Worker | - | `contact@nexusreussite.academy` |
| `SMTP_PASS` | Web/Worker | - | **REDACTED** |
| `EMAIL_FROM` | Web/Worker | - | `Nexus Réussite <contact@nexusreussite.academy>` |

---

## 🟡 VARIABLES RECOMMANDÉES - REDIS

| Variable | Scope | Valeur par défaut | Exemple |
|----------|-------|-------------------|---------|
| `REDIS_URL` | All | `redis://localhost:6379` | `redis://localhost:6379` |

---

## 🟢 VARIABLES OPTIONNELLES - STORAGE

| Variable | Scope | Valeur par défaut | Description |
|----------|-------|-------------------|-------------|
| `STORAGE_PROVIDER` | All | `local` | `local` ou `s3` |
| `AWS_ACCESS_KEY_ID` | All | - | Si S3 utilisé |
| `AWS_SECRET_ACCESS_KEY` | All | - | Si S3 utilisé |
| `AWS_REGION` | All | `eu-west-3` | Région S3 |
| `AWS_S3_BUCKET` | All | - | Nom du bucket |

---

## 🟢 VARIABLES OPTIONNELLES - VOIX/ORAL

| Variable | Scope | Valeur par défaut | Description |
|----------|-------|-------------------|-------------|
| `ORAL_VOICE_MODE` | All | `disabled` | `disabled`, `browser`, `server` |
| `OPENAI_STT_MODEL` | All | `whisper-1` | Modèle STT |

---

## 🟢 VARIABLES OPTIONNELLES - MONITORING

| Variable | Scope | Valeur par défaut | Description |
|----------|-------|-------------------|-------------|
| `LOG_LEVEL` | All | `info` | `debug`, `info`, `warn`, `error` |
| `NEXT_PUBLIC_META_PIXEL_ID` | Web | - | ID Meta Pixel (optionnel) |

---

## ❌ VARIABLES DÉPRÉCIÉES/À SUPPRIMER

| Variable | Raison | Action |
|----------|--------|--------|
| `.env.local` | Conflit avec .env.production | Supprimer en prod |
| `.release.env` | Non standard | Supprimer |
| `packages/mcp-server/.env` | Centraliser dans /opt/eaf/secrets | Déplacer |

---

## 🔧 FICHIER CANONIQUE DE PRODUCTION

**Emplacement:** `/opt/eaf/secrets/.env.production`

**Permissions:** `600`, owner `eaf:eaf`

**Format:**
```bash
# === CORE ===
NODE_ENV=production
PORT=3000
MCP_PORT=3100
NEXT_PUBLIC_APP_URL=https://eaf.nexusreussite.academy
APP_ROOT=/opt/eaf/current

# === SECRETS (générés avec openssl) ===
SESSION_SECRET=<64 chars base64>
CSRF_SECRET=<64 chars base64>
CRON_SECRET=<64 chars base64>
BILLING_CODE_PEPPER=<64 chars hex>
MCP_API_KEY=<64 chars hex>

# === DATABASE ===
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# === LLM (au moins une clé) ===
MISTRAL_API_KEY=<clé fournisseur>
# GEMINI_API_KEY=
# OPENAI_API_KEY=

# === SERVICES ===
REDIS_URL=redis://localhost:6379
RAG_API_URL=http://127.0.0.1:18001

# === EMAIL ===
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=contact@nexusreussite.academy
SMTP_PASS=<mot de passe>
EMAIL_FROM=Nexus Réussite <contact@nexusreussite.academy>

# === CONFIG ===
LLM_ROUTER_ENABLED=true
LOG_LEVEL=info
```

---

## ✅ VÉRIFICATION PRÉ-DÉPLOIEMENT

```bash
# Sur le serveur de production:
/opt/eaf/current/scripts/check-env-production.sh
```

**Doit vérifier:**
1. Toutes les variables obligatoires présentes
2. Secrets avec longueur suffisante
3. Pas de valeurs par défaut dangereuses
4. Permissions correctes sur le fichier
5. Connexion DB testable
6. Au moins un provider LLM configuré
