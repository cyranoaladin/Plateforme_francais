# 🚀 GUIDE DE DÉPLOIEMENT — PRÉ-PRODUCTION

**Projet:** Nexus Réussite EAF  
**Version:** 1.0.0  
**Date:** 1er mars 2026  
**Environnement:** Pré-production (staging)

---

## 📋 OBJECTIF

Déployer la plateforme en **pré-production** pour validation avant beta fermée.

**Durée estimée:** 2-3 heures  
**Responsable:** Lead Developer / DevOps

---

## 🏗️ ARCHITECTURE CIBLE

```
┌─────────────────────────────────────────────────┐
│              PRÉ-PRODUCTION                     │
├─────────────────────────────────────────────────┤
│  VPS (SSH + Nginx + PM2)                        │
│  ├─ Next.js (Node.js 20)                        │
│  ├─ API Routes                                  │
│  └─ MCP Server (port 3100)                      │
├─────────────────────────────────────────────────┤
│  PostgreSQL (Supabase / Neon / Railway)        │
│  ├─ 27 tables                                  │
│  ├─ pgvector activé                            │
│  └─ Migrations appliquées                      │
├─────────────────────────────────────────────────┤
│  Redis (Upstash / Railway)                     │
│  ├─ Rate limiting                              │
│  └─ Cache                                      │
└─────────────────────────────────────────────────┘
```

---

## ✅ PRÉREQUIS

### 1. Accès Nécessaires
- [ ] Accès SSH au VPS (ex: `root@88.99.254.59`)
- [ ] Accès GitHub (repository)
- [ ] Base de données PostgreSQL
- [ ] Redis instance
- [ ] Clés API (Mistral, etc.)

### 2. Variables d'Environnement

**Fichier:** `.env.preprod` (à créer)

```bash
# === OBLIGATOIRES ===
DATABASE_URL=postgresql://user:pass@host:5432/eaf_preprod
DIRECT_URL=postgresql://user:pass@host:5432/eaf_preprod
MISTRAL_API_KEY=your_mistral_api_key
SESSION_SECRET=minimum_32_characters_random_string
CSRF_SECRET=minimum_32_characters_random_string
NEXT_PUBLIC_APP_URL=https://eaf-preprod.yourdomain.com

# === SÉCURITÉ ===
CLICTOPAY_WEBHOOK_SECRET=your_webhook_secret
CLICTOPAY_USERNAME=your_username
CLICTOPAY_PASSWORD=your_password

# === OPTIONNEL (recommandé) ===
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info
NODE_ENV=production
COOKIE_SECURE=true
CRON_SECRET=minimum_32_characters_random_string

# === MONITORING ===
SENTRY_DSN=your_sentry_dsn (optionnel)
```

---

## 📝 ÉTAPES DE DÉPLOIEMENT

### Étape 1: Préparer l'Environnement (30 min)

#### 1.1 Créer la base de données

```bash
# Exemple avec Supabet
# 1. Créer projet "eaf-preprod"
# 2. Récupérer DATABASE_URL et DIRECT_URL
# 3. Activer extension pgvector

# SQL (dans Supabase SQL Editor):
CREATE EXTENSION IF NOT EXISTS vector;
```

#### 1.2 Créer instance Redis

```bash
# Exemple avec Upstash
# 1. Créer base "eaf-preprod"
# 2. Récupérer REDIS_URL
```

#### 1.3 Générer secrets

```bash
# Générer SESSION_SECRET (32+ caractères)
openssl rand -hex 32

# Générer CSRF_SECRET
openssl rand -hex 32

# Générer CRON_SECRET
openssl rand -hex 32

# Générer CLICTOPAY_WEBHOOK_SECRET
openssl rand -hex 32
```

---

### Étape 2: Configurer CI/CD (30 min)

#### 2.1 VPS (déploiement SSH)

Le dépôt fournit un script de déploiement vers un VPS :

```bash
./scripts/deploy.sh root@88.99.254.59
```

Pour une première installation (nginx + SSL) :

```bash
./scripts/deploy.sh root@88.99.254.59 --first-run
```

Le script :
- synchronise le code (rsync)
- installe les dépendances
- applique les migrations Prisma
- build Next.js + build MCP
- redémarre PM2

Les variables d'environnement doivent être présentes sur le serveur dans `.env` (non commité).

#### 2.2 Railway (si besoin uniquement pour DB/Redis)

```bash
# 1. Installer Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Init projet
railway init

# 4. Ajouter variables d'environnement
railway variables set DATABASE_URL=...
railway variables set DIRECT_URL=...
# ...

# 5. Deploy
railway up
```

---

### Étape 3: Appliquer Migrations (15 min)

```bash
# 1. Générer client Prisma
npx prisma generate

# 2. Appliquer migrations
npx prisma migrate deploy

# 3. Vérifier schema
npx prisma db push --accept-data-loss

# 4. (Optionnel) Seeder données de test
npm run db:seed
```

---

### Étape 4: Déployer l'Application (30 min)

#### 4.1 Build et Deploy

```bash
# 1. Build
npm run build

# 2. Vérifier build
npm run start

# 3. Ouvrir navigateur
# https://eaf-preprod.yourdomain.com
```

#### 4.2 Déployer MCP Server

```bash
# Si MCP Server séparé
cd packages/mcp-server
npm install
npm run build
npm run start

# Health check
curl http://localhost:3100/health
```

---

### Étape 5: Vérifications Post-Deploy (30 min)

#### 5.1 Health Checks

```bash
# 1. API Health
curl https://eaf-preprod.yourdomain.com/api/v1/health

# Attendu: {"ok":true,"database":"connected","mcp":"..."}

# 2. MCP Server Health
curl http://mcp-server-url:3100/health

# Attendu: {"status":"ok"}
```

#### 5.2 Tests Fonctionnels

```bash
# 1. Authentification
curl -X POST https://eaf-preprod.yourdomain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jean@eaf.local","password":"demo1234"}'

# 2. Rate Limiting (tester 10 requêtes rapides)
for i in {1..15}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    https://eaf-preprod.yourdomain.com/api/v1/oral/session/start \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"oeuvre":"test"}'
done

# Attendu: Premières requêtes 200, puis 429

# 3. RAG Search
curl -X POST https://eaf-preprod.yourdomain.com/api/v1/rag/search \
  -H "Content-Type: application/json" \
  -d '{"query":"explication linéaire"}'

# Attendu: Résultats avec citations
```

#### 5.3 Vérifier Logs

```bash
railway logs

# Vérifier erreurs
railway logs | grep -i error
```

---

### Étape 6: Tests Manuels de Validation (45 min)

#### 6.1 Test P1-01: Rate Limit Fail-Closed

```bash
# Test 1: Rate limit normal
curl -X POST https://eaf-preprod.yourdomain.com/api/v1/oral/session/start \
  -H "Content-Type: application/json" \
  -d '{"oeuvre":"Cahier de Douai"}'

# Répéter 10 fois rapidement
# Attendu: 429 après 5-10 requêtes

# Test 2: Simuler Redis down (si possible)
# - Stopper Redis temporairement
# - Faire requête API
# Attendu: 429 (fail-closed) en production
```

#### 6.2 Test P1-02: Input Sanitization (XSS)

```bash
# Test 1: Injection XSS dans onboarding
curl -X POST https://eaf-preprod.yourdomain.com/api/v1/onboarding/complete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "displayName": "<script>alert(document.cookie)</script>",
    "classLevel": "Première générale",
    "eafDate": "2026-06-15",
    "selectedOeuvres": ["Cahier de Douai"],
    "weakSignals": []
  }'

# Vérifier en base de données
# Attendu: displayName = "&lt;script&gt;alert(document.cookie)&lt;/script&gt;"

# Test 2: Injection dans tuteur
curl -X POST https://eaf-preprod.yourdomain.com/api/v1/tuteur/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "<img src=x onerror=alert(1)>",
    "conversationHistory": []
  }'

# Attendu: Message échappé, pas d'exécution JS
```

#### 6.3 Test P1-03: Error Messages Génériques

```bash
# Test 1: Copie inexistante
curl https://eaf-preprod.yourdomain.com/api/v1/epreuves/xxx/copie/yyy

# Attendu: {"error":"Ressource non disponible."}
# PAS: {"error":"Copie introuvable."}

# Test 2: Session inexistante
curl -X POST https://eaf-preprod.yourdomain.com/api/v1/oral/session/nonexistent/interact \
  -H "Content-Type: application/json" \
  -d '{"step":"LECTURE","transcript":"test","duration":60}'

# Attendu: {"error":"Ressource non disponible."}
# PAS: {"error":"Session introuvable."}

# Test 3: Épreuve inexistante
curl https://eaf-preprod.yourdomain.com/api/v1/epreuves/nonexistent/copie

# Attendu: {"error":"Ressource non disponible."}
```

#### 6.4 Test P1-04: Payment Flow

```bash
# Test 1: Page pricing
curl https://eaf-preprod.yourdomain.com/pricing

# Attendu: Page HTML avec FREE, PRO, MAX

# Test 2: Page confirmation
curl https://eaf-preprod.yourdomain.com/paiement/confirmation

# Attendu: Page HTML avec "Paiement réussi"

# Test 3: Page refus
curl https://eaf-preprod.yourdomain.com/paiement/refus

# Attendu: Page HTML avec "Paiement refusé"
```

---

## 📊 CHECKLIST DE VALIDATION

### Infrastructure ✅
- [ ] Base de données connectée
- [ ] Redis connecté
- [ ] MCP Server running
- [ ] HTTPS activé
- [ ] Health checks OK

### Sécurité ✅
- [ ] Rate limiting fonctionnel
- [ ] CSRF protection active
- [ ] Inputs sanitizés (XSS testé)
- [ ] Error messages génériques
- [ ] Cookies sécurisés (secure, httpOnly)

### Fonctionnel ✅
- [ ] Authentification OK
- [ ] Dashboard accessible
- [ ] Atelier oral fonctionnel
- [ ] Atelier écrit fonctionnel
- [ ] RAG search fonctionnel
- [ ] Tuteur IA fonctionnel

### Performance ✅
- [ ] Temps réponse API < 500ms
- [ ] Web Vitals corrects (LCP, FID, CLS)
- [ ] Pas d'erreurs 5xx

---

## 🐛 PLAN DE ROLLBACK

### Si Problème Critique

```bash
# 1. Revenir à la version précédente (sur votre machine)
git checkout <commit-precedent>

# 2. Redéployer sur le VPS
./scripts/deploy.sh root@88.99.254.59

# 3. Vérifier
curl https://eaf-preprod.yourdomain.com/api/v1/health

# 4. Analyser logs (VPS)
ssh root@88.99.254.59 'pm2 logs --lines 200' | grep -i error
```

### Contacts d'Urgence

| Rôle | Nom | Téléphone |
|------|-----|----------|
| Lead Dev | [À compléter] | |
| DevOps | [À compléter] | |
| Product Owner | [À compléter] | |

---

## 📈 MÉTRIQUES À SURVEILLER

### Premières 24 Heures

| Métrique | Seuil d'Alerte | Action |
|----------|----------------|--------|
| Erreurs 5xx | > 1% | Investigation immédiate |
| Latence API | > 1000ms | Optimisation requise |
| Taux erreur auth | > 5% | Vérifier config |
| Redis errors | > 0 | Check connexion |

### Outils Recommandés

- **Sentry:** Error tracking
- **WebPageTest / Lighthouse:** Web Vitals
- **Better Uptime:** Monitoring uptime
- **Logtail:** Logs aggregation

---

## ✅ CRITÈRES DE SUCCÈS

### Pour Passer en Beta

- [ ] 0 erreur 5xx sur 24h
- [ ] Latence moyenne < 500ms
- [ ] Tous tests manuels validés
- [ ] Rate limiting fonctionnel
- [ ] XSS bloqué
- [ ] Error messages génériques OK

### Pour Passer en Production

- [ ] Beta fermée réussie (100 élèves)
- [ ] NPS > 40
- [ ] 0 bug critique
- [ ] Documentation complète
- [ ] Support prêt

---

## 📞 SUPPORT

**Documentation:**
- [RUNBOOK_DEPLOY.md](./RUNBOOK_DEPLOY.md)
- [RUNBOOK_PROD.md](./RUNBOOK_PROD.md)
- [RAPPORT_VALIDATION_FIXES_P1.md](./RAPPORT_VALIDATION_FIXES_P1.md)

**Contacts:**
- Lead Developer: [À compléter]
- DevOps: [À compléter]

---

**Fin du Guide de Déploiement**
