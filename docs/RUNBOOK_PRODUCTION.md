# Runbook Production - Nexus Réussite EAF

## Architecture Réseau et Sécurité

### Ports et Services

**Production (eaf.nexusreussite.academy)**:
- Port 80 (HTTP) → Redirection 301 vers HTTPS
- Port 443 (HTTPS) → Nginx reverse proxy → App Next.js
- Port 3000 (interne) → Slot Blue Next.js app
- Port 3001 (interne) → Slot Green Next.js app
- Port 3100 (interne) → MCP Server (internal only, non exposé)
- Port 5432 (interne) → PostgreSQL avec pgvector
- Port 6379 (interne) → Redis (sessions, cache, queues)

**Staging (staging.nexusreussite.academy)**:
- Port 443 (HTTPS) → Nginx → App Next.js (port 3000)

### Configuration Firewall

#### Règles entrantes (ufw/iptables)
```bash
# SSH (admin only)
22/tcp ALLOW from <IP_ADMIN>

# HTTP/HTTPS (public)
80/tcp ALLOW from anywhere
443/tcp ALLOW from anywhere

# PostgreSQL (local only)
5432/tcp DENY from anywhere

# Redis (local only)
6379/tcp DENY from anywhere

# App ports (local only)
3000/tcp DENY from anywhere
3001/tcp DENY from anywhere
3100/tcp DENY from anywhere
```

#### Règles sortantes
```bash
# Autoriser HTTPS vers APIs externes
443/tcp ALLOW to anywhere (Mistral AI, Clictopay, Brevo)

# Autoriser DNS
53/udp ALLOW to anywhere

# Bloquer le reste par défaut
default DENY outgoing
```

### Configuration TLS/SSL

**Certificat**: Let's Encrypt (renouvellement automatique via certbot)
**Domaines couverts**:
- eaf.nexusreussite.academy
- staging.nexusreussite.academy

**Configuration Nginx TLS**:
```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;
ssl_prefer_server_ciphers on;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;

# HSTS
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

**Renouvellement automatique**:
```bash
# Cron certbot (root)
0 3 * * * certbot renew --quiet --post-hook "nginx -s reload"
```

## Configuration Nginx

### Structure Fichiers
```
/etc/nginx/
├── nginx.conf                    # Config principale
├── conf.d/
│   ├── active-slot.txt          # Fichier état Blue/Green (blue|green)
│   └── eaf-production.conf      # Config site production
└── sites-enabled/
    └── eaf-staging.conf         # Config site staging
```

### Blue-Green Deployment

**Fichier active-slot.txt**:
```bash
# Contient soit "blue" soit "green"
cat /etc/nginx/conf.d/active-slot.txt
# blue
```

**Configuration reverse proxy dynamique**:
```nginx
# /etc/nginx/conf.d/eaf-production.conf
upstream eaf_backend {
    # Déterminé dynamiquement par script lors du déploiement
    server 127.0.0.1:3000;  # ou 3001 selon slot actif
}

server {
    listen 443 ssl http2;
    server_name eaf.nexusreussite.academy;

    ssl_certificate /etc/letsencrypt/live/eaf.nexusreussite.academy/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/eaf.nexusreussite.academy/privkey.pem;

    location / {
        proxy_pass http://eaf_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint (monitoring externe)
    location = /api/v1/health {
        proxy_pass http://eaf_backend;
        access_log off;
    }

    # CSP et Security Headers
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}

# Redirection HTTP -> HTTPS
server {
    listen 80;
    server_name eaf.nexusreussite.academy;
    return 301 https://$server_name$request_uri;
}
```

### Logs et Monitoring

**Emplacements logs**:
```
/var/log/nginx/
├── access.log          # Tous les accès HTTP
├── error.log           # Erreurs Nginx
├── eaf-access.log      # Accès spécifiques app
└── eaf-error.log       # Erreurs spécifiques app
```

**Rotation logs** (logrotate):
```
/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}
```

## Processus PM2

### Applications Gérées

**Configuration** (ecosystem.config.cjs):
```javascript
module.exports = {
  apps: [
    {
      name: 'eaf-nextjs',      // App principale
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: 1,
      max_memory_restart: '1536M',
      env_production: { NODE_ENV: 'production', PORT: 3000 }
    },
    {
      name: 'eaf-mcp',         // MCP Server (internal)
      script: 'packages/mcp-server/dist/index.js',
      instances: 1,
      max_memory_restart: '256M',
      env_production: { NODE_ENV: 'production', PORT: 3100 }
    },
    {
      name: 'eaf-worker',      // Correction queue worker
      script: 'dist/lib/queue/start-worker.js',
      instances: 1,
      max_memory_restart: '1G',
      env_production: { NODE_ENV: 'production' }
    }
  ]
};
```

### Commandes Courantes

```bash
# Démarrer tous les services
pm2 start ecosystem.config.cjs --env production

# Status
pm2 status

# Logs temps réel
pm2 logs eaf-nextjs --lines 50

# Redémarrer une app
pm2 reload eaf-nextjs

# Arrêter toutes les apps
pm2 stop all

# Supprimer du process list
pm2 delete eaf-nextjs

# Sauvegarder config courante
pm2 save

# Résurrection automatique au boot
pm2 startup
```

## Checklist Déploiement Production

### Pré-déploiement

- [ ] Tests CI passent (Gates 1-5)
- [ ] Revue code complétée
- [ ] Variables d'env production vérifiées (`scripts/check-env.js`)
- [ ] Backup DB effectué
- [ ] Notification équipe planifiée

### Déploiement Blue-Green

1. **Identifier slot inactif**:
   ```bash
   ACTIVE=$(cat /etc/nginx/conf.d/active-slot.txt)
   NEXT=$([ "$ACTIVE" = "blue" ] && echo "green" || echo "blue")
   ```

2. **Déployer sur slot inactif**:
   ```bash
   cd /var/www/eaf-$NEXT
   git pull origin main
   npm ci --production
   npx prisma migrate deploy
   ```

3. **Démarrer nouveau slot**:
   ```bash
   NEXT_PORT=$([ "$NEXT" = "blue" ] && echo "3000" || echo "3001")
   PORT=$NEXT_PORT pm2 start ecosystem.config.cjs --env production --name eaf-$NEXT
   ```

4. **Smoke test**:
   ```bash
   for i in {1..30}; do
     STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${NEXT_PORT}/api/v1/health")
     [ "$STATUS" = "200" ] && break
     sleep 2
   done
   ```

5. **Basculer traffic**:
   ```bash
   echo $NEXT > /etc/nginx/conf.d/active-slot.txt
   nginx -s reload
   ```

6. **Cleanup ancien slot**:
   ```bash
   pm2 delete eaf-$ACTIVE
   ```

### Post-déploiement

- [ ] Health check public OK (https://eaf.nexusreussite.academy/api/v1/health)
- [ ] Monitoring externe valide
- [ ] Logs PM2 sans erreurs critiques
- [ ] Tests manuels fonctionnels critiques (login, inscription, paiement)
- [ ] Notification équipe succès

## Rollback Rapide

**Si smoke test échoue**:
```bash
# Arrêter le slot défaillant
pm2 delete eaf-$NEXT

# Le slot ACTIVE reste en production (pas de bascule effectuée)
# Investiguer logs:
pm2 logs eaf-$NEXT --lines 100 --err
```

**Si problème détecté après bascule**:
```bash
# Rebascule immédiate vers ancien slot (encore en mémoire PM2)
PREVIOUS=$([ "$ACTIVE" = "blue" ] && echo "green" || echo "blue")
echo $PREVIOUS > /etc/nginx/conf.d/active-slot.txt
nginx -s reload

# Redémarrer ancien slot si arrêté
pm2 restart eaf-$PREVIOUS
```

## Contacts et escalade

**Urgence production**:
- Ops Lead: [contact]
- Dev Lead: [contact]

**Services externes**:
- Hetzner Support: [support ticket URL]
- Let's Encrypt: Renouvellement automatique (surveiller expiration)

## Métriques et Alertes

### Endpoints monitoring

- **Health API**: `GET /api/v1/health` (doit retourner 200 + `{"status":"ok"}`)
- **Métriques Web Vitals**: `POST /api/v1/metrics/vitals`

### Seuils critiques

- Temps réponse API > 2s → Alerte
- Memory usage > 90% max_memory_restart → Alerte
- Disponibilité < 99.5% sur 5min → Alerte critique
- Erreurs 5xx > 1% traffic → Investigation

---

**Dernière mise à jour**: 2026-03-15
**Version**: 1.0.0
**Propriétaire**: DevOps Team
