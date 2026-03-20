# Déploiement — Nexus Réussite EAF

## Prérequis

- Accès SSH à `root@88.99.254.59`
- Node.js 20+
- PostgreSQL 16 (Docker sur le serveur, port 5433)
- Redis (port 6379)
- Nginx configuré pour `eaf.nexusreussite.academy`

## Déployer

```bash
bash scripts/deploy.sh root@88.99.254.59
```

### Ce que fait le script

1. **Rsync** du code vers `/opt/eaf_platform` (exclut .git, node_modules, .next, .env)
2. **npm ci** sur le serveur
3. **Prisma generate + migrate deploy**
4. **Build Next.js** (standalone mode)
5. **Build MCP server** (TypeScript)
6. **Restaure le symlink** ressources → `/srv/eaf_ressources`
7. **PM2 restart** avec `--update-env`

### Vérification post-deploy

```bash
curl -s https://eaf.nexusreussite.academy/api/v1/health
# Doit retourner: {"status":"ok","release":{"gitSha":"..."},...}

ssh root@88.99.254.59 "pm2 status"
# eaf-nextjs, eaf-mcp, eaf-worker doivent être "online"
```

## Variables d'environnement

Le fichier `/opt/eaf_platform/.env` doit contenir :

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5433/eaf_prod
DIRECT_URL=postgresql://user:pass@localhost:5433/eaf_prod

# Auth
SESSION_SECRET=...
CSRF_SECRET=...
COOKIE_SECURE=true

# App
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://eaf.nexusreussite.academy
NEXT_PUBLIC_API_URL=https://eaf.nexusreussite.academy/api/v1

# LLM
MISTRAL_API_KEY=...

# Email SMTP
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=contact@nexusreussite.academy
SMTP_PASS=...
EMAIL_FROM=Nexus Réussite <contact@nexusreussite.academy>
EMAIL_REPLY_TO=contact@nexusreussite.academy

# Redis
REDIS_URL=redis://localhost:6379

# RAG
RAG_API_URL=http://127.0.0.1:18001
```

## Services PM2

| Service | Description | Port |
|---------|------------|------|
| eaf-nextjs | Application Next.js | 3000 |
| eaf-mcp | Serveur MCP | 3100 |
| eaf-worker | Worker BullMQ (corrections) | - |

## Infrastructure Docker

| Container | Description | Port |
|-----------|------------|------|
| nexus-postgres-db | PostgreSQL 16 | 5433 |
| compose-ingestor-1 | RAG ingestor | 18001 |
| compose-chroma-1 | ChromaDB | 8000 |
| compose-ollama-1 | Ollama (embeddings) | 11434 |

## Rollback

```bash
# 1. Revenir au commit précédent
git revert HEAD

# 2. Redéployer
bash scripts/deploy.sh root@88.99.254.59

# 3. Vérifier
curl -s https://eaf.nexusreussite.academy/api/v1/health
```

## Ressources

Les ressources pédagogiques (548 fichiers) sont stockées dans `/srv/eaf_ressources` sur le serveur, liées via symlink `/opt/eaf_platform/ressources`. Elles ne sont pas dans le dépôt git.
