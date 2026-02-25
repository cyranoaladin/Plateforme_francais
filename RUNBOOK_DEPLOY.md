# Runbook de déploiement — Nexus Réussite EAF

## Prérequis serveur
- Ubuntu 22.04 LTS
- Node.js 20.x LTS
- PostgreSQL 15+
- Redis 7+
- PM2 (`npm install -g pm2`)
- Ollama (si embeddings locaux)

## 1. Cloner et installer

```bash
git clone <repo> eaf_platform
cd eaf_platform
npm ci --production=false
cd packages/mcp-server && npm ci && cd ../..
```

## 2. Configurer l'environnement

```bash
cp .env.example .env.local
# Éditer .env.local avec les vraies valeurs :
# DATABASE_URL, REDIS_URL, SESSION_SECRET (32+ chars), CSRF_SECRET (32+ chars),
# MISTRAL_API_KEY, MCP_API_KEY, CLICTOPAY_USERNAME, CLICTOPAY_PASSWORD,
# CLICTOPAY_WEBHOOK_SECRET, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, RESEND_API_KEY

npm run mcp:init   # Génère packages/mcp-server/.env avec MCP_API_KEY
```

## 3. Base de données

```bash
# Créer la base et l'utilisateur PostgreSQL
sudo -u postgres psql -c "CREATE USER eaf_user WITH PASSWORD 'CHANGEME';"
sudo -u postgres psql -c "CREATE DATABASE eaf_db OWNER eaf_user;"

# Appliquer les migrations
npx prisma migrate deploy

# Générer le client Prisma
npx prisma generate

# Seed optionnel (données de démonstration)
npm run db:seed
```

## 4. Indexer le corpus RAG

```bash
# Placer les fichiers PDF/TXT dans /var/eaf/corpus/
npm run rag:index
```

## 5. Build Next.js

```bash
npm run build
# En cas d'erreur Turbopack, utiliser :
npm run build:ci
```

## 6. Lancer avec PM2

```bash
# Créer l'ecosystem PM2
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [
    {
      name: 'eaf-nextjs',
      script: 'node_modules/.bin/next',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      max_memory_restart: '512M',
    },
    {
      name: 'eaf-mcp',
      cwd: './packages/mcp-server',
      script: 'node',
      args: 'dist/index.js',
      env: {
        NODE_ENV: 'production',
        MCP_TRANSPORT: 'http',
        MCP_PORT: 3100,
      },
      max_memory_restart: '256M',
    },
  ],
};
EOF

pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

## 7. Nginx (reverse proxy)

```nginx
server {
    listen 443 ssl http2;
    server_name nexusreussite.academy;

    ssl_certificate     /etc/letsencrypt/live/nexusreussite.academy/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/nexusreussite.academy/privkey.pem;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # MCP interne — ne pas exposer publiquement
    # location /mcp-internal/ { deny all; }
}

server {
    listen 80;
    server_name nexusreussite.academy;
    return 301 https://$server_name$request_uri;
}
```

## 8. Vérifications post-déploiement

```bash
# Health checks
curl https://nexusreussite.academy/api/v1/health
curl http://localhost:3100/health

# TypeScript
npm run typecheck
cd packages/mcp-server && npx tsc --noEmit && cd ../..

# Tests unitaires
npm run test:unit

# Logs
pm2 logs eaf-nextjs --lines 50
pm2 logs eaf-mcp --lines 50
```

## 9. Rollback d'urgence

```bash
pm2 stop all
git checkout <commit-precedent>
npm ci
npm run build
pm2 start ecosystem.config.cjs
```
