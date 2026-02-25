# Démarrage rapide — Nexus Réussite EAF

## Prérequis
- Node.js 20+
- PostgreSQL 15+ avec extension `pgvector`
- Redis 7+
- Ollama (optionnel, pour embeddings locaux)

## Installation

```bash
cd eaf_platform
npm install

# Configuration
cp .env.example .env.local
# Éditer .env.local avec vos valeurs

# MCP Server
npm run mcp:init
# Éditer packages/mcp-server/.env avec DATABASE_URL et REDIS_URL

# Base de données
npx prisma generate
npx prisma migrate deploy
# ou en dev:
# npx prisma migrate dev

# Seed (données de démonstration)
npm run db:seed

# Indexation RAG (corpus EAF)
npm run rag:index
```

## Démarrage développement

```bash
# Terminal 1 — MCP Server
npm run mcp:dev

# Terminal 2 — Next.js
npm run dev

# Vérification
curl http://localhost:3100/health
curl http://localhost:3000/api/mcp/health
```

## Tests

```bash
npm run test:unit
npm run mcp:test
npm run test:e2e
npm run test:all
```

## Variables obligatoires en production

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL URL |
| `REDIS_URL` | Redis URL |
| `MISTRAL_API_KEY` | Clé API Mistral |
| `MCP_API_KEY` | Clé MCP (`npm run mcp:init`) |
| `SESSION_SECRET` | Secret session (32+ chars) |
| `CSRF_SECRET` | Secret CSRF (32+ chars) |
| `LLM_ROUTER_ENABLED` | `"true"` pour activer Mistral |
| `CLICTOPAY_USERNAME` | Identifiant ClicToPay |
| `CLICTOPAY_PASSWORD` | Mot de passe ClicToPay |
| `RESEND_API_KEY` | Clé API Resend |
