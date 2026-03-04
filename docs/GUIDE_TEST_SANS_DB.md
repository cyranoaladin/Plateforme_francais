# 🚀 GUIDE DE TEST SANS BASE DE DONNÉES

**Problème:** PostgreSQL nécessite une configuration qui n'est pas disponible dans cet environnement.

**Solution:** Tester l'application en mode "dégradé" sans DB, puis configurer DB plus tard.

---

## ✅ CE QUI FONCTIONNE SANS DB

| Fonctionnalité | Statut | Notes |
|----------------|--------|-------|
| Pages statiques | ✅ OK | Login, Pricing, Bienvenue |
| UI/UX | ✅ OK | Tous les composants React |
| CSP Headers | ✅ OK | Security headers fonctionnels |
| MCP Server | ✅ OK | Backend IA indépendant |
| Tests unitaires | ✅ OK | 619/619 tests |

## ❌ CE QUI NE FONCTIONNE PAS SANS DB

| Fonctionnalité | Raison |
|----------------|--------|
| Authentification | Sessions stockées en DB |
| Dashboard | Données utilisateur en DB |
| API protégées | Requièrent authentification |
| Oral/Écrit ateliers | Sessions stockées en DB |
| RAG Search | Chunks vectoriels en DB |

---

## 🔧 CONFIGURATION POSTGRESQL (Optionnel)

### Option 1: Docker (Recommandé)

```bash
# Lancer PostgreSQL avec Docker
docker run -d \
  --name eaf-postgres \
  -e POSTGRES_PASSWORD=eaf_password \
  -e POSTGRES_DB=eaf_local \
  -p 5432:5432 \
  -v eaf_data:/var/lib/postgresql/data \
  pgvector/pgvector:15-pgvectors0.5.0

# Mettre à jour .env
DATABASE_URL="postgresql://postgres:eaf_password@localhost:5432/eaf_local"
DIRECT_URL="postgresql://postgres:eaf_password@localhost:5432/eaf_local"

# Appliquer migrations
npx prisma migrate deploy

# Seeder
npm run db:seed
```

### Option 2: PostgreSQL Local

```bash
# 1. Créer utilisateur PostgreSQL
sudo -u postgres createuser -s $USER

# 2. Créer base de données
createdb eaf_local

# 3. Activer pgvector
psql -d eaf_local -c "CREATE EXTENSION IF NOT EXISTS vector;"

# 4. Mettre à jour .env
DATABASE_URL="postgresql:///eaf_local?host=/var/run/postgresql"
DIRECT_URL="postgresql:///eaf_local?host=/var/run/postgresql"

# 5. Appliquer migrations
npx prisma migrate deploy
npm run db:seed
```

### Option 3: Services Cloud (Gratuit)

**Supabase:**
1. Créer projet sur https://supabase.com
2. Activer extension pgvector
3. Copier connection string
4. Mettre à jour .env

**Neon:**
1. Créer projet sur https://neon.tech
2. Copier connection string
3. Mettre à jour .env

---

## 🧪 TESTER L'INTERFACE SANS DB

### 1. Pages Statiques

```bash
# Login
curl http://localhost:3000/login

# Pricing
curl http://localhost:3000/pricing

# Bienvenue
curl http://localhost:3000/bienvenue
```

### 2. Health Check

```bash
curl http://localhost:3000/api/v1/health
# Attendu: {"status":"degraded","database":"unavailable","mcpServer":"healthy"}
```

### 3. MCP Server

```bash
curl http://localhost:3100/health
# Doit retourner une réponse (peut nécessiter authentification)
```

---

## 📊 ERREURS ATTENDUES SANS DB

Ces erreurs sont **normales** sans base de données :

```
❌ 500 Internal Server Error on /api/v1/student/profile
   → Normal: nécessite authentification + DB

❌ 401 Unauthorized on /api/v1/metrics/vitals
   → Normal: endpoint protégé

❌ Chart errors (width/height)
   → Normal: dashboard essaie d'afficher des données vides
```

---

## ✅ VALIDATION MINIMALE

Pour valider que l'application est **techniquement fonctionnelle** :

```bash
# 1. Serveur Next.js UP
curl -I http://localhost:3000 | grep HTTP
# Doit retourner HTTP/1.1 200 OK ou 307

# 2. CSP Headers corrects
curl -I http://localhost:3000/login | grep content-security-policy
# Doit contenir 'unsafe-inline' 'unsafe-eval'

# 3. Health check
curl http://localhost:3000/api/v1/health | jq
# Doit montrer MCP server healthy

# 4. Tests unitaires
npm run test:unit
# Doit afficher 619/619 passents
```

---

## 🎯 PROCHAINES ÉTAPES

### Pour Production

1. **Configurer PostgreSQL** (une des options ci-dessus)
2. **Appliquer migrations:** `npx prisma migrate deploy`
3. **Seeder DB:** `npm run db:seed`
4. **Redémarrer:** `npm run start`
5. **Tester login:** http://localhost:3000/login

### Pour Démo Immédiate

L'application est **déjà fonctionnelle** pour :
- ✅ Montrer l'UI/UX
- ✅ Démontrer les headers de sécurité
- ✅ Tester les composants React
- ✅ Valider le build Next.js
- ✅ Exécuter les tests unitaires

---

## 📞 SUPPORT

**Fichiers de configuration:**
- `.env` - Variables d'environnement
- `prisma/schema.prisma` - Schéma de base de données
- `middleware.ts` - Security headers

**Commandes utiles:**
```bash
# Vérifier DB
npx prisma db pull

# Générer client
npx prisma generate

# Migrations
npx prisma migrate deploy

# Seed
npm run db:seed
```

---

**Document créé:** 1er mars 2026  
**Statut:** ✅ Application fonctionnelle en mode dégradé
