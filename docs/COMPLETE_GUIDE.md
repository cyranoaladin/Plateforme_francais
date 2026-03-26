# Nexus Réussite EAF — Documentation Complète

> Plateforme interactive de préparation aux Épreuves Anticipées de Français (EAF) du baccalauréat 2026.
> Destinée aux élèves de Première en Tunisie.

---

## 📚 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture technique](#architecture-technique)
3. [Base de données](#base-de-données)
4. [API Reference](#api-reference)
5. [Workflows utilisateurs](#workflows-utilisateurs)
6. [Plans et facturation](#plans-et-facturation)
7. [Sécurité et RGPD](#sécurité-et-rgpd)
8. [Déploiement](#déploiement)
9. [Développement](#développement)
10. [Référence rapide](#référence-rapide)

---

## Vue d'ensemble

### 🎯 Mission

Nexus Réussite EAF accompagne les élèves de Première dans leur préparation aux épreuves anticipées de français du bac 2026 via :
- **4 ateliers pédagogiques** : écrit, oral, langue, quiz
- **Tuteur IA personnalisé** avec RAG (30 skills spécialisées)
- **Bibliothèque pédagogique** de 548 ressources
- **Système de révision** avec répétition espacée

### 🏗️ Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| ORM/Database | Prisma 6, PostgreSQL 16, pgvector |
| Cache | Redis |
| Styling | Tailwind CSS |
| LLM | Mistral (principal), Gemini/OpenAI/Ollama (fallback) |
| RAG | Ingesteur Docker externe + pgvector fallback |
| Email | Nodemailer SMTP (Hostinger) |
| Auth | Sessions server-side, CSRF double-submit |
| AI Tools | MCP Server (24 outils) |

### 📁 Structure du projet

```
eaf_platform/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (ateliers)/         # Pages des 4 ateliers
│   │   ├── admin/              # Interface admin
│   │   ├── api/v1/             # API REST
│   │   ├── login/              # Auth pages
│   │   └── pricing/            # Page tarifs
│   ├── components/             # Composants React
│   └── lib/                    # Logique métier
│       ├── auth/               # Sessions, CSRF, guards
│       ├── billing/            # Plans, quotas, codes
│       ├── db/                 # Prisma client, repositories
│       ├── email/              # SMTP, templates
│       ├── llm/                # Router LLM, skills
│       ├── rag/                # Client RAG
│       ├── security/           # Rate limiting, CSP
│       └── validation/         # Zod schemas
├── packages/
│   └── mcp-server/             # Serveur MCP (24 outils)
├── prisma/
│   ├── schema.prisma           # Schéma DB (843 lignes)
│   └── migrations/             # 19 migrations
├── scripts/                    # Scripts CLI
└── docs/                       # Documentation
```

---

## Architecture technique

### 🔄 Flux de requêtes

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Client    │────▶│   Nginx      │────▶│   Next.js App   │
│  (Browser)  │     │  (Reverse    │     │   (VPS Hetzner) │
└─────────────┘     │   Proxy)     │     └─────────────────┘
                    └──────────────┘              │
                                                  ▼
                    ┌──────────────┐     ┌─────────────────┐
                    │   Redis      │◀───▶│   PostgreSQL    │
                    │  (Cache)     │     │   (Data)        │
                    └──────────────┘     └─────────────────┘
                                                  │
                                                  ▼
                                         ┌─────────────────┐
                                         │   RAG Service   │
                                         │  (Docker ext.)  │
                                         └─────────────────┘
```

### 🛡️ Middleware et sécurité

Le fichier `middleware.ts` gère :

1. **CSP (Content Security Policy)** dynamique avec nonce
2. **Headers de sécurité** : X-Frame-Options, HSTS, etc.
3. **Authentification** : vérification session cookie
4. **Alias français** : `/connexion` → `/login`
5. **Rate limiting** : par IP sur routes sensibles

```typescript
// Routes publiques (pas de auth requise)
PUBLIC_PATHS = ['/login', '/pricing', '/contact', ...]
PUBLIC_API_PATHS = ['/api/v1/auth/login', '/api/v1/health', ...]
```

### 🔐 Authentification

**Sessions server-side** (pas de JWT) :
- Cookie `eaf_session` : HttpOnly, Secure, SameSite=Lax
- Durée : configurable (défaut 7 jours)
- Stockage : table `Session` en base

**CSRF Protection** (double-submit cookie) :
- Cookie `csrf_token` (HttpOnly)
- Header `X-CSRF-Token` à fournir sur POST/PUT/DELETE

**Rôles utilisateurs** :
| Rôle | Description | Accès |
|------|-------------|-------|
| `eleve` | Élève de Première | Ateliers, tuteur IA, profil |
| `parent` | Parent (optionnel) | Dashboard progression |
| `enseignant` | Enseignant (optionnel) | Gestion classe, corrections |
| `admin` | Administrateur | Codes activation, paiements, stats |

---

## Base de données

### 📊 Schéma complet

**19 migrations** gérées par Prisma. Modèles principaux :

#### Authentification & Profils
- `User` — Compte (email, passwordHash, role)
- `Session` — Sessions actives (token, expiresAt)
- `StudentProfile` — Profil élève complet (50+ champs)

#### Facturation
- `Subscription` — Abonnement actif (plan, status, période)
- `PaymentTransaction` — Historique paiements
- `ActivationCode` — Codes d'activation (hachés SHA-256 + pepper)
- `UsageCounter` — Quotas par feature/période

#### Ateliers
- `OralSession` — Sessions d'oral (préparation + passage)
- `OralPhaseScore` — Scores par phase (lecture, explication...)
- `OralTranscript` — Transcriptions texte
- `OralBilan` — Bilan final avec note/20
- `EpreuveBlanche` — Sujets d'écrit générés
- `CopieDeposee` — Copies déposées par élèves

#### RAG & IA
- `Chunk` — Vecteurs RAG (embedding 1024-d)
- `LlmCostLog` — Tracking coûts LLM
- `MemoryEvent` — Événements mémoire (timeline)

#### RGPD
- `ComplianceLog` — Log actions conformité
- Champs `parentConsent*` dans StudentProfile

### 🔗 Relations clés

```
User 1:1 StudentProfile
User 1:N Session
User 1:1 Subscription
User 1:N OralSession
User 1:N MemoryEvent
User 1:N PaymentTransaction
StudentProfile 1:N SkillMapEntry
StudentProfile 1:N WeakSkillEntry
StudentProfile 1:N OralSession (via User)
```

---

## API Reference

### 🌐 Structure des endpoints

Toutes les API sont sous `/api/v1/`

#### Authentification
| Endpoint | Méthode | Description | Auth |
|----------|---------|-------------|------|
| `/auth/register` | POST | Inscription élève | ❌ |
| `/auth/login` | POST | Connexion | ❌ |
| `/auth/logout` | POST | Déconnexion | ✅ |
| `/auth/me` | GET | Profil connecté | ✅ |
| `/auth/forgot-password` | POST | Reset password | ❌ |
| `/auth/reset-password` | POST | Confirmer reset | ❌ |

#### Facturation
| Endpoint | Méthode | Description | Auth |
|----------|---------|-------------|------|
| `/billing/status` | GET | Statut abonnement | ✅ |
| `/billing/redeem-code` | POST | Activer code | ✅ |
| `/billing/check-quota` | GET | Vérifier quota | ✅ |

#### Admin
| Endpoint | Méthode | Description | Auth |
|----------|---------|-------------|------|
| `/admin/activation-codes` | GET/POST | Gestion codes | admin |
| `/admin/manual-payment` | POST | Valider paiement | admin |
| `/admin/users` | GET | Liste users | admin |
| `/admin/stats` | GET | Statistiques | admin |

#### Ateliers
| Endpoint | Méthode | Description | Auth |
|----------|---------|-------------|------|
| `/oral/session/start` | POST | Démarrer une session orale | ✅ |
| `/oral/session/[sessionId]/interact` | POST | Interaction pendant l'oral | ✅ |
| `/oral/session/[sessionId]/end` | POST | Finaliser la session | ✅ |
| `/epreuves/generate` | POST | Générer sujet écrit | ✅ |
| `/epreuves/[id]/copie` | POST | Déposer copie | ✅ |
| `/langue/generate` | POST | Exercice langue | ✅ |
| `/quiz/generate` | POST | Générer un quiz | ✅ |
| `/quiz/evaluate` | POST | Évaluer les réponses | ✅ |

#### Tuteur IA
| Endpoint | Méthode | Description | Auth |
|----------|---------|-------------|------|
| `/tuteur/message` | POST | Message au tuteur | ✅ |
| `/rag/search` | POST | Recherche RAG | ✅ |

#### RGPD
| Endpoint | Méthode | Description | Auth |
|----------|---------|-------------|------|
| `/rgpd/consent` | GET | Consentement parent | ❌ (token) |
| `/rgpd/export` | GET | Export données (Art. 20) | ✅ |
| `/rgpd/delete` | DELETE | Suppression compte | ✅ |

### 📋 Exemples de requêtes

**Inscription** :
```bash
curl -X POST https://eaf.nexusreussite.academy/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "eleve@example.com",
    "password": "SecurePass123!",
    "displayName": "Jean Dupont",
    "isMinor": true,
    "parentEmail": "parent@example.com",
    "acceptedCgu": true,
    "cguVersion": "2026-03"
  }'
```

**Activation code** :
```bash
curl -X POST https://eaf.nexusreussite.academy/api/v1/billing/redeem-code \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: <token>" \
  -b "eaf_session=<session>" \
  -d '{"code": "EAF-XXXX-XXXX-XXXX"}'
```

---

## Workflows utilisateurs

### 🎓 Parcours élève (`eleve`)

```
1. Landing (/)
   │
   ▼
2. Inscription (/login?mode=register)
   │  └── Si mineur: email parent requis (RGPD)
   │
   ▼
3. Onboarding (/onboarding)
   │  ├── Niveau scolaire
   │  ├── Œuvres sélectionnées
   │  └── Objectif de score
   │
   ▼
4. Tableau de bord (/dashboard)
   │  ├── Accès aux 4 ateliers
   │  ├── Progression
   │  └── Tuteur IA
   │
   ├──▶ Atelier Écrit (/atelier-ecrit)
   │      ├── Générer sujet
   │      ├── Rédiger copie
   │      └── Correction IA
   │
   ├──▶ Atelier Oral (/atelier-oral)
   │      ├── Tirage au sort œuvre
   │      ├── Préparation (30 min)
   │      ├── Passage (12 + 8 min)
   │      └── Bilan avec note
   │
   ├──▶ Atelier Langue (/atelier-langue)
   │      └── Exercices ciblés
   │
   └──▶ Quiz (/quiz)
          └── Quiz adaptatif
```

### 👨‍🏫 Parcours enseignant (enseignant)

```
1. Connexion avec rôle "enseignant"
   │
   ▼
2. Dashboard (/enseignant)
   │  ├── Code classe (à partager)
   │  ├── Liste élèves
   │  ├── Copies à corriger
   │  └── Statistiques classe
   │
   └──▶ Correction copies
          └── Commentaires personnalisés
```

### 👨‍💼 Parcours admin (admin)

```
1. Connexion avec rôle "admin"
   │
   ▼
2. Dashboard (/admin)
   │  ├── Génération codes activation
   │  ├── Validation paiements manuels
   │  ├── Liste utilisateurs
   │  └── Statistiques globales
   │
   ├──▶ Codes activation
   │      └── Générer codes Premium/Masterium
   │
   └──▶ Paiements manuels
          └── Valider après réception virement
```

### 💳 Flux de paiement (manuel)

```
Élève                           Admin
  │                               │
  ├─── Choix plan (/pricing) ───▶ │
  │                               │
  ├─── WhatsApp/contact ────────▶ │
  │                               │
  ├─── Virement bancaire ──────▶ │
  │    (avec référence email)     │
  │                               │
  │◀── Code activation ──────────│
  │    (généré manuellement)      │
  │                               │
  └─── Saisie code ─────────────▶
       (/billing/redeem-code)
```

---

## Plans et facturation

### 📦 Catalogue des plans

| Plan | ID interne | Prix | Période |
|------|--------------|------|---------|
| **Freemium** | `FREE` | 0 TND | Gratuit |
| **Premium** | `PREMIUM` | 99 TND/mois | Mensuel |
| **Masterium** | `PRO` | 129 TND/mois | Mensuel |

Les identifiants ci-dessus sont internes. Côté produit visible, seuls Freemium, Premium et Masterium doivent apparaître.

### 📊 Quotas par plan

| Feature | Freemium | Premium | Masterium |
|---------|-----------|---------|------------|
| Sessions orales | 1/mois | 10/semaine | Illimité |
| Corrections écrites | 2/mois | 20/mois | Illimité |
| Questions tuteur | 3/jour | 100/jour | Illimité |
| Tokens LLM | 8 000/jour | 50 000/jour | 200 000/jour |
| Recherches RAG | 50/jour | 500/jour | Illimité |
| Quiz | 3/jour | 30/jour | Illimité |
| OCR copies | 2/mois | 20/mois | 50/mois |

### 🏳️ Feature flags

| Feature | Freemium | Premium | Masterium |
|---------|-----------|---------|------------|
| Rapport PDF oral | ❌ | ✅ | ✅ |
| Historique oral | ❌ | ❌ | ✅ |
| Tableau de bord parent | ❌ | ✅ | ✅ |
| Support | FAQ | Email | Prioritaire |
| Parcours adaptatif | ❌ | ✅ | ✅ |
| Avocat du diable | ❌ | ✅ | ✅ |
| Graph RAG | ❌ | ❌ | ✅ |
| Bibliothèque complète | ❌ | ✅ | ✅ |

### 🔐 Codes d'activation

- Format : `EAF-XXXX-XXXX-XXXX` (16 caractères alphanum)
- Hachage : SHA-256 + pepper (`BILLING_CODE_PEPPER`)
- Statuts : `CREATED` → `DELIVERED` → `REDEEMED` | `REVOKED`

---

## Sécurité et RGPD

### 🔒 Mesures de sécurité

1. **Authentification** :
   - Mots de passe : bcrypt (salt unique par user)
   - Sessions : cookies HttpOnly, Secure, SameSite=Lax
   - CSRF : double-submit pattern

2. **Protection** :
   - Rate limiting : Redis-based, 3-10 req/min selon route
   - CSP dynamique avec nonce par requête
   - Headers de sécurité (HSTS, X-Frame-Options, etc.)

3. **Données** :
   - Chiffrement en transit (TLS 1.3)
   - Pepper pour codes d'activation
   - Pas de stockage carte bancaire (paiement manuel)

### 📜 RGPD Compliance

**Mineurs (Article 8)** :
- Consentement parental obligatoire si < 15 ans
- Email parent requis lors inscription
- Token de consentement unique généré
- Email automatique envoyé au parent
- Endpoint `/api/v1/rgpd/consent` pour validation

**Droits des utilisateurs** :
- Droit d'accès : export données JSON
- Droit à l'effacement : suppression cascade (36 tables)
- DPO : dpo@nexusreussite.academy

**Conservation** :
- Données actives : durée d'utilisation + 36 mois
- Logs anonymisés : 12 mois
- Suppression automatique après inactivité

---

## Déploiement

### 🖥️ Infrastructure

| Composant | Détail |
|-----------|--------|
| VPS | Hetzner Cloud (88.99.254.59) |
| OS | Ubuntu 22.04 LTS |
| Process Manager | PM2 |
| Reverse Proxy | Nginx |
| Database | PostgreSQL 16 (localhost:5432) |
| Cache | Redis (localhost:6379) |
| Domaine | eaf.nexusreussite.academy |

### 🚀 Procédure de déploiement

```bash
# 1. Vérifier les tests
npm run test:unit
npm run build

# 2. Déployer
bash scripts/deploy.sh root@88.99.254.59

# 3. Vérifier
ssh root@88.99.254.59 'pm2 status'
curl -s https://eaf.nexusreussite.academy/api/v1/health
```

### 📋 Variables d'environnement (production)

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/eaf?schema=public"
DIRECT_URL="postgresql://user:pass@localhost:5432/eaf?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# Email SMTP (Hostinger STARTTLS)
SMTP_HOST="smtp.hostinger.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="contact@nexusreussite.academy"
SMTP_PASS="<secret>"

# Sécurité
BILLING_CODE_PEPPER="<pepper-32-chars>"
CRON_SECRET="<secret>"

# LLM
MISTRAL_API_KEY="<key>"
GEMINI_API_KEY="<key>"  # fallback

# RAG
RAG_API_URL="http://localhost:8000"
RAG_API_KEY="<key>"

# MCP
MCP_SERVER_URL="http://localhost:3001"
MCP_API_KEY="<key>"
```

---

## Développement

### 🛠️ Prérequis

- Node.js 20+
- PostgreSQL 16 avec pgvector
- Redis 7+
- Git

### 📥 Installation locale

```bash
# 1. Cloner
git clone <repo>
cd eaf_platform

# 2. Dépendances
npm ci

# 3. Database
npx prisma generate
npx prisma migrate dev

# 4. Seed (optionnel)
npx prisma db seed

# 5. Démarrer
npm run dev
```

### 🧪 Tests

```bash
# Tests unitaires
npm run test:unit

# Tests E2E (Playwright)
npm run test:e2e

# Linting
npm run lint

# Build
npm run build
```

### 📝 Conventions de code

- **TypeScript** : strict mode activé
- **Imports** : alias `@/` pour `src/`
- **Composants** : PascalCase, un par fichier
- **API routes** : export `GET`/`POST`/`PUT`/`DELETE` explicite
- **Error handling** : `try/catch` + logger + message user-friendly

---

## Référence rapide

### 🔗 URLs importantes

| Environnement | URL |
|---------------|-----|
| Production | https://eaf.nexusreussite.academy |
| Health API | https://eaf.nexusreussite.academy/api/v1/health |
| API Base | https://eaf.nexusreussite.academy/api/v1 |

### 👤 Comptes de test

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@eaf.local | AdminTest2026! |
| Élève Freemium | eleve.free@eaf.local | FreeTest2026! |

### 📞 Contacts

| Rôle | Contact |
|------|---------|
| Support | support@nexusreussite.academy |
| DPO | dpo@nexusreussite.academy |
| WhatsApp | +216 99 192 829 |

### 🆘 Commandes utiles

```bash
# Logs production
ssh root@88.99.254.59 'pm2 logs eaf-platform --lines 50'

# Restart
ssh root@88.99.254.59 'pm2 restart eaf-platform'

# Database
ssh root@88.99.254.59 'sudo -u postgres psql eaf'

# Redis
ssh root@88.99.254.59 'redis-cli'
```

---

## 📄 Documents complémentaires

- [ARCHITECTURE.md](./ARCHITECTURE.md) — Détails architecture
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Guide déploiement complet
- [PLANS_AND_BILLING.md](./PLANS_AND_BILLING.md) — Détails facturation
- [CONTRIBUTING.md](./CONTRIBUTING.md) — Guide contributeur
- [RUNBOOK_PRODUCTION.md](./RUNBOOK_PRODUCTION.md) — Runbook opérationnel

---

<p align="center">
  <strong>Nexus Réussite EAF</strong> — La méthode complète pour assurer votre réussite au bac 2026
</p>
