# MATRICE ENVIRONNEMENT PRODUCTION - NEXUS EAF (CANONIQUE)
**Version:** 2.0.0  
**Date:** 2026-04-12  
**Variables identifiées:** 82

---

## LÉGENDE

| Colonne | Description |
|---------|-------------|
| **Variable** | Nom exact dans le code |
| **Scope** | web / worker / mcp / all / build / ops |
| **Obligatoire** | 🔴 Oui / 🟡 Recommandé / 🟢 Optionnel |
| **Format** | Type attendu |
| **Génération** | Commande ou source |
| **Fichiers** | Où consommé dans le code |
| **Impact absent** | Conséquence si manquant |
| **Statut** | active / legacy / deprecated |

---

## 🔴 SECTION A: CORE - OBLIGATOIRES ABSOLUES

| Variable | Scope | Format | Génération | Fichiers | Impact absent | Statut |
|----------|-------|--------|------------|----------|---------------|--------|
| `NODE_ENV` | All | `production` | Static | All | Runtime incorrect | active |
| `PORT` | Web | `3000` | Static | src/lib/server/server.ts | Default 3000 | active |
| `NEXT_PUBLIC_APP_URL` | Web | `https://...` | Manual | src/lib/constants.ts | URLs cassées | active |
| `DATABASE_URL` | All | `postgresql://...` | Manual | prisma/schema.prisma | Crash application | active |
| `DIRECT_URL` | All | `postgresql://...` | Manual | prisma/schema.prisma | Migrations échouent | active |
| `SESSION_SECRET` | All | 64 chars base64 | `openssl rand -base64 32` | src/lib/auth/session.ts | Sessions non sécurisées | active |
| `CSRF_SECRET` | All | 64 chars base64 | `openssl rand -base64 32` | src/lib/security/csrf.ts | CSRF vulnérable | active |
| `MISTRAL_API_KEY` | All/LLM | `sk-...` | Mistral Console | src/lib/llm/providers/mistral.ts | Pas de LLM | active |

**Commandes de génération:**
```bash
openssl rand -base64 32  # SESSION_SECRET, CSRF_SECRET
openssl rand -base64 32  # CRON_SECRET
openssl rand -hex 32     # BILLING_CODE_PEPPER
openssl rand -hex 32     # MCP_API_KEY
```

---

## 🔴 SECTION B: SÉCURITÉ - OBLIGATOIRES PRODUCTION

| Variable | Scope | Format | Génération | Fichiers | Impact absent | Statut |
|----------|-------|--------|------------|----------|---------------|--------|
| `CRON_SECRET` | All | 64 chars base64 | `openssl rand -base64 32` | src/app/api/v1/cron/*/route.ts | Cron non sécurisé | active |
| `BILLING_CODE_PEPPER` | All | 64 chars hex | `openssl rand -hex 32` | src/lib/billing/redeem.ts | Codes activations crackables | active |
| `MCP_API_KEY` | Web/MCP | 64 chars hex | `openssl rand -hex 32` | packages/mcp-server/src/index.ts | MCP non auth | active |

---

## 🟡 SECTION C: SERVICES - RECOMMANDÉS

| Variable | Scope | Format | Défaut | Fichiers | Impact absent | Statut |
|----------|-------|--------|--------|----------|---------------|--------|
| `REDIS_URL` | All | `redis://...` | - | src/lib/redis/client.ts | Pas de cache distribué | active |
| `SMTP_HOST` | Web/Worker | `smtp...` | - | src/lib/email/smtp.ts | Pas d'emails | active |
| `SMTP_PORT` | Web/Worker | `587` | `587` | src/lib/email/smtp.ts | Default 587 | active |
| `SMTP_USER` | Web/Worker | email | - | src/lib/email/smtp.ts | Auth SMTP échoue | active |
| `SMTP_PASS` | Web/Worker | string | - | src/lib/email/smtp.ts | Auth SMTP échoue | active |
| `EMAIL_FROM` | Web/Worker | `Nom <email>` | - | src/lib/email/smtp.ts | Expéditeur invalide | active |
| `RAG_API_URL` | All | `http://...` | - | src/lib/rag/client.ts | Pas de recherche contextuelle | active |

---

## 🟡 SECTION D: LLM - MULTI-PROVIDER

| Variable | Scope | Format | Fournisseur | Impact absent | Statut |
|----------|-------|--------|-------------|---------------|--------|
| `GEMINI_API_KEY` | All/LLM | `AI...` | Google AI | Fallback LLM | active |
| `OPENAI_API_KEY` | All/LLM | `sk-...` | OpenAI | Fallback LLM + STT | active |
| `LLM_ROUTER_ENABLED` | All | `true/false` | - | Routage désactivé | active |
| `LLM_PROVIDER_ORDER` | All | `gemini,openai,mistral` | - | Ordre par défaut | active |
| `LLM_TIMEOUT_MS` | All | `30000` | - | Timeout 30s | active |
| `LLM_MULTI_PROVIDER_FALLBACK` | All | `true/false` | - | Pas de fallback | active |

---

## 🟢 SECTION E: CONFIGURATION OPTIONNELLE

| Variable | Scope | Format | Défaut | Description | Statut |
|----------|-------|--------|--------|-------------|--------|
| `MCP_SERVER_URL` | Web | `http://localhost:3100` | `http://localhost:3100` | URL MCP | active |
| `MCP_PORT` | MCP | `3100` | `3100` | Port MCP | active |
| `APP_ROOT` | All | `/opt/eaf/current` | CWD | Racine app | active |
| `LOG_LEVEL` | All | `info/debug/warn/error` | `info` | Niveau logs | active |
| `MAX_UPLOAD_SIZE_MB` | Web | `10` | `10` | Limite upload | active |
| `CONTACT_EMAIL` | Web | email | - | Email contact | active |
| `RESSOURCES_ROOT` | All | `/srv/...` | - | Ressources externes | active |

---

## 🟢 SECTION F: MISTRAL - CONFIGURATION AVANCÉE

| Variable | Scope | Format | Défaut | Description | Statut |
|----------|-------|--------|--------|-------------|--------|
| `MISTRAL_BASE_URL` | LLM | URL | `https://api.mistral.ai/v1` | Endpoint | active |
| `MISTRAL_REASONING_MODEL` | LLM | string | `magistral-medium-latest` | Modèle raisonnement | active |
| `MISTRAL_LARGE_MODEL` | LLM | string | `mistral-large-latest` | Modèle large | active |
| `MISTRAL_STANDARD_MODEL` | LLM | string | `mistral-small-latest` | Modèle standard | active |
| `MISTRAL_MICRO_MODEL` | LLM | string | `ministral-8b-latest` | Modèle micro | active |
| `MISTRAL_OCR_MODEL` | LLM | string | `mistral-ocr-latest` | Modèle OCR | active |
| `MISTRAL_EMBED_MODEL` | LLM | string | `mistral-embed` | Modèle embedding | active |
| `MISTRAL_DAILY_BUDGET_EUR` | LLM | number | - | Budget journalier | active |
| `MISTRAL_MONTHLY_BUDGET_EUR` | LLM | number | - | Budget mensuel | active |

---

## 🟢 SECTION G: RAG - CONFIGURATION AVANCÉE

| Variable | Scope | Format | Défaut | Description | Statut |
|----------|-------|--------|--------|-------------|--------|
| `RAG_API_TOKEN` | All | string | - | Token auth RAG | active |
| `RAG_TIMEOUT_MS` | All | number | `8000` | Timeout RAG | active |
| `RAG_CHUNK_SIZE` | All | number | `500` | Taille chunk | active |
| `RAG_CHUNK_OVERLAP` | All | number | `80` | Chevauchement | active |
| `RAG_COLLECTION` | All | string | `rag_francais_premiere` | Collection | active |
| `RAG_TOP_K` | All | number | `10` | Résultats max | active |
| `RAG_RERANK` | All | `true/false` | `true` | Re-ranking | active |
| `RAG_ALPHA` | All | number | `0.7` | Poids hybrid | active |

---

## 🟢 SECTION H: MONITORING & TRACKING

| Variable | Scope | Format | Défaut | Description | Statut |
|----------|-------|--------|--------|-------------|--------|
| `NEXT_PUBLIC_META_PIXEL_ID` | Web | string | - | Meta Pixel | active |
| `META_CAPI_TOKEN` | Web | string | - | Meta CAPI | active |
| `HEALTH_CHECK_READY` | All | `true/false` | - | Health probe | active |
| `BUILD_GIT_SHA` | All | string | - | Version build | active |

---

## 🟢 SECTION I: STORAGE & UPLOADS

| Variable | Scope | Format | Défaut | Description | Statut |
|----------|-------|--------|--------|-------------|--------|
| `STORAGE_PROVIDER` | All | `local/s3` | `local` | Provider | active |
| `AWS_ACCESS_KEY_ID` | All | string | - | AWS Key | active |
| `AWS_SECRET_ACCESS_KEY` | All | string | - | AWS Secret | active |
| `AWS_REGION` | All | string | `eu-west-3` | Région | active |
| `AWS_S3_BUCKET` | All | string | - | Bucket | active |

---

## 🟢 SECTION J: ORAL / VOICE / TTS

| Variable | Scope | Format | Défaut | Description | Statut |
|----------|-------|--------|--------|-------------|--------|
| `ORAL_VOICE_MODE` | All | `disabled/browser/server` | `disabled` | Mode voix | active |
| `OPENAI_STT_MODEL` | All | `whisper-1` | `whisper-1` | Modèle STT | active |
| `OPENAI_TTS_MODEL` | All | `tts-1` | `tts-1` | Modèle TTS | active |
| `OPENAI_TTS_VOICE` | All | `alloy/...` | `alloy` | Voix | active |
| `TTS_API_KEY` | All | string | - | Clé TTS externe | active |
| `TTS_API_URL` | All | URL | - | Endpoint TTS | active |
| `TTS_VOICE_ID` | All | string | - | ID voix | active |

---

## 🟢 SECTION K: OLLAMA - LOCAL

| Variable | Scope | Format | Défaut | Description | Statut |
|----------|-------|--------|--------|-------------|--------|
| `OLLAMA_BASE_URL` | LLM | `http://localhost:11434` | - | Endpoint Ollama | active |
| `OLLAMA_MODEL` | LLM | `llama3.1:70b` | - | Modèle local | active |
| `OLLAMA_EMBEDDING_MODEL` | LLM | `nomic-embed-text` | - | Modèle embedding | active |
| `OLLAMA_TIMEOUT_MS` | LLM | `30000` | - | Timeout | active |
| `LLM_FORCE_LOCAL` | LLM | `true/false` | `false` | Force local | active |

---

## 🟢 SECTION L: PUSH NOTIFICATIONS

| Variable | Scope | Format | Défaut | Description | Statut |
|----------|-------|--------|--------|-------------|--------|
| `VAPID_PUBLIC_KEY` | Web | string | - | Clé publique VAPID | active |
| `VAPID_PRIVATE_KEY` | Web | string | - | Clé privée VAPID | active |
| `VAPID_SUBJECT` | Web | `mailto:...` | - | Contact VAPID | active |

---

## 🟢 SECTION M: WHATSAPP / COMMUNICATION

| Variable | Scope | Format | Défaut | Description | Statut |
|----------|-------|--------|--------|-------------|--------|
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Web | `+216...` | - | Numéro WA | active |
| `NEXT_PUBLIC_WHATSAPP_LINK` | Web | `https://wa.me/...` | - | Lien WA | active |

---

## 🔴 SECTION N: VALIDATION OBLIGATOIRE

Variables qui DOIVENT être vérifiées avant tout déploiement:

```bash
# Check core
[[ -n "$NODE_ENV" ]] && [[ "$NODE_ENV" == "production" ]]
[[ -n "$DATABASE_URL" ]]
[[ -n "$DIRECT_URL" ]]
[[ -n "$SESSION_SECRET" ]] && [[ ${#SESSION_SECRET} -ge 32 ]]
[[ -n "$CSRF_SECRET" ]] && [[ ${#CSRF_SECRET} -ge 32 ]]

# Check au moins un LLM
[[ -n "$MISTRAL_API_KEY" ]] || [[ -n "$GEMINI_API_KEY" ]] || [[ -n "$OPENAI_API_KEY" ]]

# Check secrets
[[ -n "$BILLING_CODE_PEPPER" ]] && [[ ${#BILLING_CODE_PEPPER} -ge 32 ]]
[[ -n "$MCP_API_KEY" ]] && [[ ${#MCP_API_KEY} -ge 32 ]]
```

---

## FICHIER CANONIQUE DE PRODUCTION

**Emplacement:** `/opt/eaf/secrets/.env.production`

**Permissions:** `600`, owner `eaf:eaf`

**Template:** Voir `.env.production.example` dans le repo

---

## VARIABLES DÉPRÉCIÉES / SUPPRIMÉES

| Variable | Raison | Action |
|----------|--------|--------|
| `S`, `E` | Artefacts parsing | Ignorer |
| `APP_URL` | Doublon avec NEXT_PUBLIC_APP_URL | Utiliser NEXT_PUBLIC_APP_URL |
| `ADMIN_EMAIL` | Non utilisé activement | Optionnel |
| `EMAIL_REPLY_TO` | Non utilisé | Optionnel |
| `SMTP_PASSWORD` | Doublon SMTP_PASS | Utiliser SMTP_PASS |
| `COOKIE_SECURE` | Géré par middleware | Ignorer |
| `START_SCHEDULER` | Feature flag obsolète | Ignorer |

---

## COMMANDES DE VÉRIFICATION

```bash
# Vérifier toutes les variables
bash scripts/check-env-production.sh

# Vérifier spécifiquement
bash scripts/check-env-production.sh --strict
```
