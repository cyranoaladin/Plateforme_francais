# Guide de deploiement

## Pre-requis

- Acces SSH : `root@88.99.254.59`
- Node.js 20 installe sur le serveur
- PostgreSQL en cours d'execution
- Redis en cours d'execution
- Fichier `.env` configure sur le serveur (`/root/eaf_platform/.env`)

## Deployer

```bash
bash scripts/deploy.sh root@88.99.254.59
```

Le script effectue les operations suivantes :

1. `rsync` du code source vers le serveur (exclut `node_modules`, `.next`, `.git`)
2. `npm ci --production` sur le serveur
3. `npx prisma generate` puis `npx prisma migrate deploy`
4. `npm run build` (build Next.js)
5. `pm2 restart` de l'application avec `--update-env`
6. Injection de `BUILD_GIT_SHA` et `BUILD_TIME` pour le endpoint `/api/v1/health`

## Variables d'environnement

Le fichier `.env` sur le serveur doit contenir ces variables (voir `.env.example` pour les valeurs par defaut) :

### Base de donnees
- `DATABASE_URL`
- `DIRECT_URL`

### Redis
- `REDIS_URL`

### Authentification
- `SESSION_SECRET`
- `CSRF_SECRET`
- `CRON_SECRET`
- `COOKIE_SECURE` (mettre `true` en production)

### LLM
- `LLM_ROUTER_ENABLED`
- `MISTRAL_API_KEY`
- `GEMINI_API_KEY` (optionnel, fallback)
- `OPENAI_API_KEY` (optionnel, fallback)
- `LLM_PROVIDER_ORDER`
- `LLM_TIMEOUT_MS`

### RAG
- `RAG_API_URL`
- `RAG_API_TOKEN`
- `RAG_COLLECTION`

### Email
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_FROM`

### Paiement (ClicToPay)
- `CLICTOPAY_USERNAME`
- `CLICTOPAY_PASSWORD`
- `CLICTOPAY_API_BASE_URL`
- `CLICTOPAY_PUBLIC_BASE_URL`
- `CLICTOPAY_WEBHOOK_SECRET`

### Application
- `NEXT_PUBLIC_APP_URL` (mettre `https://eaf.nexusreussite.academy`)
- `NODE_ENV` (mettre `production`)
- `LOG_LEVEL`

### MCP Server
- `MCP_SERVER_URL`
- `MCP_API_KEY`

## Verification post-deploiement

```bash
# Verifier que l'application repond
curl https://eaf.nexusreussite.academy/api/v1/health

# Verifier le statut PM2
ssh root@88.99.254.59 "pm2 status"

# Consulter les logs
ssh root@88.99.254.59 "pm2 logs --lines 50"
```

Le endpoint `/api/v1/health` retourne un JSON avec :
- `status` : "ok" ou "degraded"
- `gitSha` : hash du commit deploye
- `buildTime` : horodatage du build

## Rollback

En cas de probleme apres un deploiement :

```bash
# Sur la machine locale, revenir au commit precedent
git revert HEAD

# Redeployer
bash scripts/deploy.sh root@88.99.254.59
```

Pour un rollback immediat sans nouveau commit :

```bash
ssh root@88.99.254.59 "cd /root/eaf_platform && git checkout <commit-hash> && npm ci && npx prisma migrate deploy && npm run build && pm2 restart all --update-env"
```

## Nginx

Nginx sert de reverse proxy devant PM2. La configuration se trouve dans `/etc/nginx/sites-available/` sur le serveur. Le certificat SSL est gere par Let's Encrypt (certbot).
