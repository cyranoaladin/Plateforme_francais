# Démarrage rapide — Nexus Réussite EAF

Dernière mise à jour : 25 février 2026

## Prérequis
- Node.js 20+
- PostgreSQL 15+ (avec extension `pgvector` pour RAG vectoriel, optionnel)
- Redis 7+

## Installation

```bash
cd eaf_platform
npm install

# Configuration
# Créer .env (ou .env.local) avec vos valeurs (voir table ci-dessous)

# Base de données
npx prisma generate
npx prisma migrate deploy

# Seed (données de démonstration — compte jean@eaf.local / demo1234)
npm run db:seed

# Indexation RAG (corpus EAF, optionnel)
npm run rag:index
```

## Démarrage développement

```bash
# Terminal 1 — Next.js
npm run dev

# Terminal 2 — MCP Server (optionnel)
npm run mcp:dev

# Vérification
curl http://localhost:3000/api/v1/health
```

Application : `http://localhost:3000`

Compte démo : `jean@eaf.local` / `demo1234`

## Tests

```bash
npm run typecheck       # TypeScript
npm run test:unit       # Vitest (60+ fichiers)
npm run test:e2e        # Playwright
npm run mcp:test        # Tests MCP Server
npm run test:all        # Unit + MCP
```

## Variables obligatoires en production

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `DIRECT_URL` | PostgreSQL direct URL (Prisma) |
| `REDIS_URL` | Redis connection string |
| `MISTRAL_API_KEY` | Clé API Mistral (LLM principal) |
| `LLM_PROVIDER` | `mistral` (défaut) / `gemini` / `openai` |
| `LLM_ROUTER_ENABLED` | `"true"` pour routage multi-tier Mistral |
| `COOKIE_SECURE` | `"true"` en production |
| `SESSION_SECRET` | Secret session (32+ chars) |
| `CRON_SECRET` | Secret routes cron (32+ chars) |
| `CLICTOPAY_USERNAME` | Identifiant ClicToPay |
| `CLICTOPAY_PASSWORD` | Mot de passe ClicToPay |
| `RESEND_API_KEY` | Clé API Resend (emails) |
| `VAPID_PUBLIC_KEY` | Clé VAPID push notifications |
| `VAPID_PRIVATE_KEY` | Clé VAPID privée |

Variables optionnelles : `GEMINI_API_KEY`, `OPENAI_API_KEY`, `MCP_API_KEY`, `STORAGE_PROVIDER`, `MAX_UPLOAD_SIZE_MB`.
