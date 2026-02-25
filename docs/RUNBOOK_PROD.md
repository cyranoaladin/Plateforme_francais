# RUNBOOK Production - EAF Premium

Dernière mise à jour : 25 février 2026

## 1. Objectif
Guide d'exploitation pour :
- démarrage/arrêt
- diagnostics
- sauvegardes/restauration
- incidents
- release/rollback

## 2. Architecture opérée
- **Serveur** : VPS Ubuntu 22.04 (`88.99.254.59`, alias SSH `mf`)
- **Domaine** : `eaf.nexusreussite.academy`
- **App** : Monolithe Next.js 16.1.6 (UI + API) — `/var/www/eaf_platform`
- **Process manager** : PM2 (nom : `eaf-platform`, port 3000)
- **Reverse proxy** : Nginx (HTTPS Let's Encrypt)
- **DB** : PostgreSQL 15+ (`eaf_prod`, port 5435 local)
- **Cache/queue** : Redis 7+
- **Fallback local** : `.data/memory-store.json`
- **Fichiers copies** : `.data/uploads/copies/*`
- **Worker correction** : BullMQ (Redis)
- **MCP Server** : `packages/mcp-server` (port 3100, optionnel)

## 3. Variables critiques
- `DATABASE_URL`, `DIRECT_URL` (PostgreSQL)
- `REDIS_URL`
- `MISTRAL_API_KEY` (LLM principal)
- `GEMINI_API_KEY`, `OPENAI_API_KEY` (fallbacks)
- `LLM_PROVIDER`, `LLM_ROUTER_ENABLED`
- `COOKIE_SECURE=true`, `SESSION_SECRET`
- `CRON_SECRET`
- `CLICTOPAY_USERNAME`, `CLICTOPAY_PASSWORD`
- `RESEND_API_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`
- `STORAGE_PROVIDER`, `MAX_UPLOAD_SIZE_MB`

## 4. Démarrage / arrêt production
```bash
ssh mf
cd /var/www/eaf_platform

# Démarrer
pm2 start eaf-platform

# Arrêter
pm2 stop eaf-platform

# Redémarrer
pm2 restart eaf-platform

# Statut
pm2 status eaf-platform
```

## 5. Déploiement standard
```bash
ssh mf
cd /var/www/eaf_platform
git pull origin main
npm install
npm run build
pm2 restart eaf-platform
```

## 6. Vérifications post-déploiement
- `curl https://eaf.nexusreussite.academy/api/v1/health`
- Login/logout sur `/login`
- Dashboard `/`
- Route API critique : `/api/v1/rag/search`
- `pm2 logs eaf-platform --lines 20` (vérifier absence d'erreurs)

## 7. Sauvegardes
### 7.1 PostgreSQL
```bash
pg_dump -p 5435 eaf_prod > backups/eaf_prod-$(date +%F-%H%M%S).sql
```
Conserver au moins 14 jours de dumps.

### 7.2 Redis
- Les données Redis (vitals, rate-limits) sont éphémères (TTL).
- Pas de backup critique nécessaire.

### 7.3 Fichiers locaux
```bash
mkdir -p backups
cp .data/memory-store.json backups/memory-store-$(date +%F-%H%M%S).json
cp -r .data/uploads backups/uploads-$(date +%F-%H%M%S)
```

## 8. Restauration
### 8.1 PostgreSQL
```bash
psql -p 5435 eaf_prod < backups/eaf_prod-YYYY-MM-DD.sql
npx prisma generate
pm2 restart eaf-platform
```

### 8.2 Fallback local
- Stopper : `pm2 stop eaf-platform`
- Restaurer `.data/memory-store.json` + `.data/uploads/`
- Redémarrer : `pm2 start eaf-platform`

## 9. Incident response
### 9.1 Symptômes fréquents
- **401 massifs** : session/cookies expirés, vérifier `COOKIE_SECURE`
- **403 CSRF** : token manquant/mismatch, rafraîchir la page
- **CSP bloque scripts** : vérifier middleware CSP (`script-src 'self' 'unsafe-inline'`)
- **Correction copie bloquée** : worker BullMQ ou provider LLM indisponible
- **RAG vectoriel indisponible** : fallback lexical actif automatiquement
- **Redis down** : rate-limiting et vitals dégradés, app continue de fonctionner

### 9.2 Plan d'action rapide
1. `pm2 status` — vérifier que le process est online
2. `pm2 logs eaf-platform --lines 50` — chercher erreurs
3. `curl localhost:3000/api/v1/health` — health check
4. Vérifier PostgreSQL : `psql -p 5435 -c "SELECT 1" eaf_prod`
5. Vérifier Redis : `redis-cli ping`
6. Vérifier variables d'env : `.env`
7. Rollback si incident critique (voir §11)

## 10. Logs / observabilité
### 10.1 Logs backend
- Logger : `pino` (JSON structuré)
- `pm2 logs eaf-platform` pour suivre en temps réel
- Événements LLM tracés : skill, modèle, tier, tokens, latence, succès, coût

### 10.2 Métriques frontend
- Web Vitals agrégés via `POST /api/v1/metrics/vitals` (stockage Redis TTL 24h)
- Lecture admin : `GET /api/v1/metrics/vitals`

### 10.3 Coûts LLM
- Tracking Prisma `LlmCostLog` (par skill/provider/tier)
- Alertes budget : `LlmBudgetAlert`

## 11. Release checklist
```bash
npm run typecheck
npm run lint
npm run test:unit
npm run build
```

## 12. Rollback
```bash
ssh mf
cd /var/www/eaf_platform
pm2 stop eaf-platform
git log --oneline -5              # trouver le commit précédent
git checkout <commit-precedent>
npm install
npm run build
pm2 start eaf-platform
```
Restaurer DB si nécessaire (voir §8.1). Rerun smoke tests (voir §6).

## 13. Sécurité opérationnelle
- Ne jamais commiter de secrets
- `COOKIE_SECURE=true` en production
- CSP headers appliqués par le middleware
- Limiter l'accès SSH aux opérateurs
- Auditer régulièrement les dépendances (`npm audit`)

## 14. Limitations opérationnelles actuelles
- `STORAGE_PROVIDER=s3` non implémenté (local uniquement)
- Espace parent minimal
