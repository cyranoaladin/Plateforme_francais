# Guide de Déploiement — Nexus Réussite EAF

> Procédures complètes pour le déploiement en production

---

## 📋 Prérequis

### Infrastructure requise

| Composant | Spécification |
|-----------|---------------|
| **Serveur** | VPS Hetzner (88.99.254.59) ou équivalent |
| **OS** | Ubuntu 22.04 LTS |
| **CPU** | 4 vCPU minimum |
| **RAM** | 8 GB minimum, 16 GB recommandé |
| **Disk** | 100 GB SSD |
| **Network** | IPv4 publique, ports 22, 80, 443 ouverts |

### Services installés

| Service | Version | Port |
|---------|---------|------|
| PostgreSQL | 16 | 5432 (localhost only) |
| Redis | 7 | 6379 (localhost only) |
| Node.js | 20 LTS | - |
| PM2 | Latest | - |
| Nginx | Latest | 80, 443 |

---

## 🚀 Déploiement rapide

```bash
bash scripts/deploy.sh root@88.99.254.59
```

**Le script effectue:**
1. Build local de l'application
2. Connexion SSH au serveur
3. Git pull sur le serveur
4. Installation des dépendances (`npm ci`)
5. Génération Prisma client
6. Déploiement des migrations
7. Build Next.js (mode standalone)
8. Redémarrage PM2
9. Vérification santé

---

## 🖥️ Configuration serveur complète

### 1. Installation PostgreSQL 16

```bash
# Ajouter le repo PostgreSQL
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Installer
sudo apt update
sudo apt install -y postgresql-16 postgresql-contrib-16

# Activer l'extension pgvector
sudo -u postgres psql -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Créer la base et l'utilisateur
sudo -u postgres psql -c "CREATE DATABASE eaf;"
sudo -u postgres psql -c "CREATE USER eafuser WITH PASSWORD '<password>';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE eaf TO eafuser;"

# Configurer l'accès local
sudo nano /etc/postgresql/16/main/pg_hba.conf
# Modifier: local all all peer -> local all all md5
sudo systemctl restart postgresql
```

### 2. Installation Redis

```bash
sudo apt install -y redis-server
sudo nano /etc/redis/redis.conf
# bind 127.0.0.1 ::1
# requirepass <strong-password>
sudo systemctl restart redis
```

### 3. Installation Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
npm install -g pm2
```

### 4. Installation et configuration Nginx

```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/eaf.nexusreussite.academy
```

```nginx
server {
    listen 80;
    server_name eaf.nexusreussite.academy;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name eaf.nexusreussite.academy;

    ssl_certificate /etc/letsencrypt/live/eaf.nexusreussite.academy/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/eaf.nexusreussite.academy/privkey.pem;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/eaf.nexusreussite.academy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. Certificat SSL (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d eaf.nexusreussite.academy
```

---

## ⚙️ Variables d'environnement

### Fichier `.env` (production)

```bash
# ============================================
# Base de données
# ============================================
DATABASE_URL="postgresql://eafuser:<password>@localhost:5432/eaf?schema=public"
DIRECT_URL="postgresql://eafuser:<password>@localhost:5432/eaf?schema=public"

# ============================================
# Cache
# ============================================
REDIS_URL="redis://:<password>@localhost:6379"

# ============================================
# Application
# ============================================
NEXT_PUBLIC_BASE_URL="https://eaf.nexusreussite.academy"
NEXT_PUBLIC_APP_NAME="Nexus Réussite EAF"
NODE_ENV="production"

# ============================================
# Sécurité
# ============================================
BILLING_CODE_PEPPER="<32-char-random-string>"
CRON_SECRET="<32-char-random-string>"
CSRF_SECRET="<32-char-random-string>"

# ============================================
# Email SMTP (Hostinger STARTTLS)
# ============================================
SMTP_HOST="smtp.hostinger.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="contact@nexusreussite.academy"
SMTP_PASS="<password>"
EMAIL_FROM="Nexus Réussite <contact@nexusreussite.academy>"
EMAIL_REPLY_TO="support@nexusreussite.academy"

# ============================================
# LLM Providers
# ============================================
MISTRAL_API_KEY="<key>"
GEMINI_API_KEY="<key>"
OPENAI_API_KEY="<key>"

# ============================================
# RAG Service
# ============================================
RAG_API_URL="http://localhost:8000"
RAG_API_KEY="<key>"

# ============================================
# MCP Server
# ============================================
MCP_SERVER_URL="http://localhost:3001"
MCP_API_KEY="<key>"
```

---

## 🔧 Configuration PM2

Le fichier `ecosystem.config.cjs`:

```javascript
module.exports = {
  apps: [{
    name: 'eaf-platform',
    script: './.next/standalone/server.js',
    cwd: '/opt/eaf_platform',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    log_file: '/var/log/pm2/eaf-platform.log',
    out_file: '/var/log/pm2/eaf-platform-out.log',
    err_file: '/var/log/pm2/eaf-platform-error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '2G',
    watch: false,
  }],
};
```

### Commandes PM2

```bash
pm2 start ecosystem.config.cjs
pm2 restart eaf-platform
pm2 stop eaf-platform
pm2 logs eaf-platform --lines 100
pm2 monit
pm2 save
pm2 startup systemd
```

---

## 🔄 Workflow de déploiement

### Déploiement standard

```bash
# 1. Tests et build local
npm run test:unit
npm run lint
npm run build

# 2. Déploiement
bash scripts/deploy.sh root@88.99.254.59

# 3. Vérification
curl -s https://eaf.nexusreussite.academy/api/v1/health | jq
ssh root@88.99.254.59 'pm2 status'
```

### Rollback

```bash
# Revert git + redéployer
git revert HEAD
git push origin main
bash scripts/deploy.sh root@88.99.254.59

# OU: revenir à un commit spécifique
ssh root@88.99.254.59 "cd /opt/eaf_platform && git checkout <commit> && npm ci && npm run build && pm2 restart all"
```

---

## 🛡️ Sécurité

### Pare-feu UFW

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

### Backup automatique

```bash
#!/bin/bash
# /opt/scripts/backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/eaf"

# Backup PostgreSQL
pg_dump eaf > "$BACKUP_DIR/db_$DATE.sql"

# Backup Redis
redis-cli SAVE
cp /var/lib/redis/dump.rdb "$BACKUP_DIR/redis_$DATE.rdb"

# Rétention 7 jours
find $BACKUP_DIR -mtime +7 -delete
```

```bash
# Crontab (2h du matin)
0 2 * * * /opt/scripts/backup.sh
```

---

## 📊 Monitoring et logs

### Logs importants

| Type | Emplacement |
|------|-------------|
| Application | `/var/log/pm2/eaf-platform-*.log` |
| Nginx | `/var/log/nginx/*.log` |
| PostgreSQL | `/var/log/postgresql/*.log` |

### Vérification santé

```bash
curl https://eaf.nexusreussite.academy/api/v1/health
# Retourne: status, gitSha, buildTime, services
```

---

## 🚨 Procédures d'urgence

### Base de données corrompue

```bash
pm2 stop eaf-platform
sudo -u postgres psql -c "DROP DATABASE eaf;"
sudo -u postgres psql -c "CREATE DATABASE eaf;"
sudo -u postgres psql eaf < /backup/eaf/db_YYYYMMDD.sql
pm2 start eaf-platform
```

### Redis indisponible

```bash
sudo systemctl restart redis
redis-cli ping  # Doit répondre PONG
```

---

## 📞 Contacts

| Situation | Contact |
|-----------|---------|
| Support technique | support@nexusreussite.academy |
| Urgence | WhatsApp: +216 99 192 829 |
| DPO/RGPD | dpo@nexusreussite.academy |

---

<p align="center">
  <a href="./COMPLETE_GUIDE.md">← Retour au guide complet</a>
</p>
