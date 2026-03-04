# Runbook de déploiement — Nexus Réussite EAF

Dernière mise à jour : 25 février 2026

## Prérequis serveur
- Ubuntu 22.04 LTS
- Node.js 20.x LTS
- PostgreSQL 15+ (port 5435 sur le serveur actuel)
- Redis 7+
- PM2 (`npm install -g pm2`)
- Nginx + Let's Encrypt (certbot)

## Serveur actuel
- **IP** : `88.99.254.59` (alias SSH `mf`)
- **Domaine** : `eaf.nexusreussite.academy`
- **Chemin app** : `/var/www/eaf_platform`
- **PM2 process** : `eaf-platform`

## 1. Cloner et installer

```bash
git clone https://github.com/cyranoaladin/Plateforme_francais.git /var/www/eaf_platform
cd /var/www/eaf_platform
npm install
```

## 2. Configurer l'environnement

```bash
# Créer .env avec les variables suivantes :
DATABASE_URL="postgresql://user:pass@127.0.0.1:5435/eaf_prod"
DIRECT_URL="postgresql://user:pass@127.0.0.1:5435/eaf_prod"
REDIS_URL="redis://127.0.0.1:6379"
MISTRAL_API_KEY="sk-..."
GEMINI_API_KEY="..."                 # fallback
OPENAI_API_KEY="..."                 # fallback
LLM_PROVIDER="mistral"
LLM_ROUTER_ENABLED="true"
COOKIE_SECURE="true"
SESSION_SECRET="<32+ chars>"
CRON_SECRET="<32+ chars>"
CLICTOPAY_USERNAME="..."
CLICTOPAY_PASSWORD="..."
RESEND_API_KEY="..."
VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
STORAGE_PROVIDER="local"
MAX_UPLOAD_SIZE_MB="20"
```

## 3. Base de données

```bash
# Créer la base (si première installation)
sudo -u postgres psql -p 5435 -c "CREATE DATABASE eaf_prod;"

# Appliquer les migrations
npx prisma migrate deploy

# Générer le client Prisma
npx prisma generate

# Synchroniser le schema (si nécessaire)
npx prisma db push

# Seed (données de démonstration)
npm run db:seed
```

## 4. Build Next.js

```bash
npm run build
# En cas d'erreur Turbopack :
npm run build:ci
```

## 5. Lancer avec PM2

```bash
pm2 start npm --name "eaf-platform" -- start
pm2 save
pm2 startup
```

## 6. Nginx (reverse proxy)

```nginx
server {
    listen 443 ssl http2;
    server_name eaf.nexusreussite.academy;

    ssl_certificate     /etc/letsencrypt/live/eaf.nexusreussite.academy/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/eaf.nexusreussite.academy/privkey.pem;

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
}

server {
    listen 80;
    server_name eaf.nexusreussite.academy;
    return 301 https://$server_name$request_uri;
}
```

## 7. Mise à jour (déploiement courant)

```bash
ssh mf
cd /var/www/eaf_platform
git pull origin main
npm install
npm run build
pm2 restart eaf-platform
```

## 8. Vérifications post-déploiement

```bash
# Health check
curl https://eaf.nexusreussite.academy/api/v1/health

# Logs
pm2 logs eaf-platform --lines 50

# PM2 status
pm2 status eaf-platform
```

## 9. Rollback d'urgence

```bash
ssh mf
cd /var/www/eaf_platform
pm2 stop eaf-platform
git log --oneline -5
git checkout <commit-precedent>
npm install
npm run build
pm2 start eaf-platform
```
