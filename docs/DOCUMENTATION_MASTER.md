# 📚 Nexus EAF - Documentation Complète

**Dernière mise à jour :** 1 mars 2026  
**Version :** 1.0.0  
**Statut :** ✅ Production locale opérationnelle

---

## 🎯 Vue d'ensemble

**Nexus EAF** est une plateforme complète de préparation aux Épreuves Anticipées de Français (Première générale) combinant :

- 🤖 **Tuteur IA** avec RAG (Recherche Augmentée)
- 📝 **Atelier Écrit** (commentaire, dissertation)
- 🎤 **Atelier Oral** (simulations interactives)
- 📖 **Bibliothèque** (553 ressources pédagogiques)
- 🎬 **Lecteur Vidéo** intégré (322 vidéos)
- 👨‍🏫 **Espace Enseignant** (suivi de classe)
- 🏆 **Gamification** (badges, XP, niveaux)

---

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 20+
- PostgreSQL 16+ avec pgvector
- Redis (optionnel)

### Installation
```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'environnement
cp .env.example .env  # Puis éditer avec vos clés API

# 3. Initialiser la base de données
npx prisma generate
npx prisma migrate dev
npm run db:seed

# 4. Démarrer le serveur de développement
npm run dev
```

### Accès
- **Application :** http://localhost:3000
- **Compte démo :** `jean@eaf.local` / `demo1234`

---

## 📊 État Actuel du Projet

### ✅ Fonctionnalités en Production

| Module | Statut | Détails |
|--------|--------|---------|
| **Authentification** | ✅ Complet | Login/Register/Logout, rôles (élève, enseignant, parent) |
| **Dashboard** | ✅ Connecté | Timeline mémoire, scores, streak, badges |
| **Atelier Écrit** | ✅ Complet | Génération sujet, dépôt copie, OCR, correction IA, PDF |
| **Atelier Oral** | ✅ Complet | Sessions IA (start/interact/end), STT/TTS navigateur |
| **Onboarding** | ✅ 3 étapes | Profil, œuvres, auto-évaluation |
| **Parcours** | ✅ Personnalisé | Recommandations adaptatives |
| **Quiz** | ✅ Adaptatif | Questions par compétence |
| **Bibliothèque** | ✅ 553 ressources | Annales, œuvres, vidéos, documents, rapports |
| **Lecteur Vidéo** | ✅ Intégré | 322 vidéos lisibles directement |
| **Tuteur IA** | ✅ RAG activé | Réponses contextuelles avec citations |
| **Espace Enseignant** | ✅ Complet | Classes, progression, exports CSV |
| **Gamification** | ✅ Actif | Badges, XP, niveaux, classements |
| **Monitoring** | ✅ Actif | Logs Pino, Web Vitals |

### ⚠️ Limites Connues

| Limitation | Impact | Solution de contournement |
|------------|--------|---------------------------|
| `STORAGE_PROVIDER=s3` non implémenté | Stockage local uniquement | Fichiers dans `.data/uploads/` |
| Worker correction in-process | Pas de queue externe | Correction synchrone |
| Métriques Web Vitals en mémoire | Non persistées | Logs uniquement |
| Espace parent minimal | Page placeholder | À développer |

---

## 🛠️ Stack Technique

### Frontend
| Technologie | Version | Usage |
|-------------|---------|-------|
| **Next.js** | 16.1.6 | Framework principal (App Router) |
| **React** | 19.2.3 | Bibliothèque UI |
| **TypeScript** | 5.x | Typage strict |
| **Tailwind CSS** | 4.x | Styling |
| **Recharts** | 3.7.0 | Graphiques |
| **Lucide React** | 0.575.0 | Icônes |

### Backend
| Technologie | Version | Usage |
|-------------|---------|-------|
| **Prisma** | 6.16.2 | ORM |
| **PostgreSQL** | 16+ | Base de données |
| **pgvector** | - | Embeddings vectoriels (RAG) |
| **Pino** | 10.3.1 | Logs structurés |
| **Node-cron** | 4.2.1 | Tâches planifiées |

### IA & LLM
| Technologie | Version | Usage |
|-------------|---------|-------|
| **Gemini API** | 0.24.1 | Google AI |
| **OpenAI API** | 6.22.0 | GPT models |
| **Mistral AI** | 1.8.1 | Modèles Mistral |

### Tests & Qualité
| Technologie | Version | Usage |
|-------------|---------|-------|
| **Vitest** | 4.0.0 | Tests unitaires |
| **Playwright** | 1.56.1 | Tests E2E |
| **ESLint** | 9.x | Linting |

---

## 📁 Architecture du Projet

```
eaf_platform/
├── src/
│   ├── app/                    # Pages & API routes (App Router)
│   │   ├── api/v1/            # API REST
│   │   │   ├── auth/          # Authentification
│   │   │   ├── student/       # Espace élève
│   │   │   ├── enseignant/    # Espace enseignant
│   │   │   ├── oral/          # Atelier oral
│   │   │   ├── ecrit/         # Atelier écrit
│   │   │   ├── rag/           # Recherche RAG
│   │   │   └── tuteur/        # Tuteur IA
│   │   ├── bibliotheque/      # Page bibliothèque
│   │   ├── tuteur/            # Page tuteur IA
│   │   ├── atelier-ecrit/     # Page atelier écrit
│   │   ├── atelier-oral/      # Page atelier oral
│   │   └── login/             # Page de connexion
│   ├── components/            # Composants React
│   ├── lib/                   # Logique métier
│   │   ├── auth/              # Authentification & guards
│   │   ├── llm/               # Orchestrateur LLM
│   │   ├── rag/               # Recherche RAG
│   │   ├── oral/              # Service oral
│   │   ├── correction/        # Correction de copies
│   │   └── security/          # Sécurité (CSRF, rate-limit)
│   └── data/                  # Données de référence
│       ├── references.ts      # Références officielles
│       ├── media-catalog.ts   # Catalogue médias
│       ├── ressources.ts      # Ressources (553 fichiers)
│       └── ressources-scan.json # Index généré
├── prisma/
│   ├── schema.prisma          # Schéma de base de données
│   ├── migrations/            # Migrations (8 migrations)
│   └── seed.ts                # Seed initial
├── scripts/
│   ├── scan-ressources.ts     # Scan des ressources
│   ├── seed.ts                # Seed utilisateur
│   └── index-rag.ts           # Indexation RAG
├── ressources/                # Ressources pédagogiques (553 fichiers)
│   ├── Annales_EAF/          # 29 annales
│   ├── Oeuvres/              # 9 œuvres intégrales
│   ├── Videos/               # 322 vidéos
│   ├── Documents_Extraits/   # 163 documents
│   └── eaf_rapport_jury/     # 30 rapports de jury
├── public/
│   ├── images/               # Logos Nexus Réussite
│   └── ressources -> ../ressources  # Symlink vers ressources
├── tests/
│   ├── unit/                 # Tests unitaires (619 tests)
│   └── e2e/                  # Tests E2E Playwright
└── docs/                     # Documentation (29 fichiers)
```

---

## 🗄️ Base de Données

### Schéma Prisma

**Entités principales :**

| Modèle | Description | Champs clés |
|--------|-------------|-------------|
| `User` | Utilisateurs | id, email, role (eleve/enseignant/parent) |
| `Session` | Sessions auth | token, userId, expiresAt |
| `StudentProfile` | Profil élève | displayName, classLevel, xp, level, badges |
| `MemoryEvent` | Timeline mémoire | type, feature, payload |
| `Evaluation` | Évaluations | kind, score, status |
| `EpreuveBlanche` | Épreuves générées | type, sujet, bareme |
| `CopieDeposee` | Copies déposées | filePath, ocrText, correction |
| `OralSession` | Sessions orales | status, mode, transcript, feedback |
| `Chunk` | Documents RAG | content, embedding (vector(768)) |

### Migrations appliquées

1. `0001_init` - Schéma de base
2. `0002_student_profile_onboarding` - Onboarding
3. `0003_profile_badges` - Badges & XP
4. `0004_rag_columns_and_missing_models` - RAG
5. `0005_oral_eaf_conformity` - Oral conformité
6. `0006_oral_v2_schema` - Oral v2
7. `0007_billing_plans_v2` - Facturation
8. `0008_addendum_memory_store_v1` - Memory store

---

## 🔐 Sécurité

### Authentification
- Cookies HTTP-only (`eaf_session`, `eaf_role`)
- Protection CSRF (token `eaf_csrf`)
- Rate-limiting (10 req/min sur auth)
- Sessions de 14 jours

### Autorisation
- Middleware global (`middleware.ts`)
- Guards par route (`requireAuthenticatedUser`)
- Rôles : `eleve`, `enseignant`, `parent`, `admin`

### Headers de Sécurité
```typescript
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; media-src 'self' blob: mediastream:
```

---

## 📚 Bibliothèque de Ressources

### Statistiques

| Catégorie | Nombre | Formats |
|-----------|--------|---------|
| **Annales EAF** | 29 | PDF |
| **Œuvres** | 9 | PDF |
| **Vidéos** | 322 | WEBM, MKV, MP4 |
| **Documents** | 163 | PDF, DOC |
| **Rapports de jury** | 30 | PDF |
| **TOTAL** | **553** | - |

### Fonctionnalités

- ✅ **Filtres par catégorie** avec compteurs
- ✅ **Recherche textuelle** (titres, catégories, types)
- ✅ **Recherche RAG** sémantique
- ✅ **Lecteur vidéo intégré** (webm, mkv, mp4)
- ✅ **Téléchargement** de fichiers
- ✅ **Aperçu modal** avec métadonnées

### Titres Intelligents

Les ressources affichent des **titres compréhensibles** :

| Nom de fichier | Titre affiché |
|----------------|---------------|
| `22-frgean1.pdf` | 2022 - Bac Français Général - Amérique du Nord - Sujet 1 |
| `La_Peau_de_chagrin.pdf` | La Peau de chagrin - Balzac |
| `⏱️ BALZAC Resume.webm` | BALZAC, La Peau de chagrin - Résumé en 1 minute |

---

## 🎬 Lecteur Vidéo

### Formats Supportés

| Format | Statut | Navigateurs |
|--------|--------|-------------|
| **WEBM** | ✅ Recommandé | Tous |
| **MKV** | ✅ Compatible | Chrome, Firefox, Edge |
| **MP4** | ✅ Universel | Tous |

### Fonctionnalités

- ✅ Lecture/Pause native
- ✅ Barre de progression
- ✅ Contrôle du volume
- ✅ Plein écran
- ✅ Vitesse (0.5x, 1x, 1.5x, 2x)
- ✅ Picture-in-Picture
- ✅ Poster personnalisé (logo Nexus)

### Configuration

```typescript
// next.config.ts - Headers pour streaming
{
  source: '/ressources/:path*',
  headers: [
    { key: 'Accept-Ranges', value: 'bytes' },
    { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
  ]
}
```

---

## 🤖 Intelligence Artificielle

### Orchestrateur LLM

**Providers supportés :**
- Gemini (Google)
- OpenAI (GPT-4, GPT-3.5)
- Mistral AI

**Skills disponibles :**
- `bibliothecaire` - Recherche documentaire
- `correcteur` - Correction de copies
- `examinateur` - Simulation orale
- `coach` - Recommandations personnalisées
- `grammairien` - Questions de grammaire

### RAG (Recherche Augmentée)

**Fonctionnement :**
1. Requête utilisateur
2. Recherche vectorielle (pgvector) ou lexicale
3. Contexte enrichi avec citations
4. Réponse LLM structurée

**Fallback automatique :**
- Vectoriel → Lexical si pgvector indisponible
- LLM → Réponses structurées si API indisponible

---

## 🧪 Tests

### Tests Unitaires (Vitest)

**619 tests passés** couvrant :

| Module | Tests | Couverture |
|--------|-------|------------|
| Memory/Context | 19 | ✅ |
| Compliance/Anti-triche | 27 | ✅ |
| Security/Sanitize | 23 | ✅ |
| LLM/Mistral | 24 | ✅ |
| Oral/State Machine | 26 | ✅ |
| RAG/Chunker | 6 | ✅ |
| Badges | 8 | ✅ |
| ... | ... | ✅ |

### Tests E2E (Playwright)

**Scénarios couverts :**
- Authentification
- Upload de copie
- Correction IA
- Session orale
- Navigation complète

### Commandes de Test

```bash
# Tests unitaires
npm run test:unit

# Tests E2E
npm run test:e2e

# Tous les tests
npm run test

# Tests MCP
npm run mcp:test
```

---

## 📦 Commandes Disponibles

```bash
# Développement
npm run dev              # Serveur de développement
npm run build            # Build de production
npm run start            # Start production server

# Tests & Qualité
npm run lint             # ESLint
npm run typecheck        # TypeScript
npm run test             # Tous les tests
npm run test:unit        # Tests unitaires
npm run test:e2e         # Tests E2E

# Base de données
npm run prisma:generate  # Générer Prisma Client
npm run prisma:migrate   # Migrations
npm run db:seed          # Seed initial
npm run db:seed:media    # Seed catalogue médias

# RAG
npm run rag:index        # Indexation RAG

# MCP Server
npm run mcp:dev          # MCP en développement
npm run mcp:build        # Build MCP
npm run mcp:start        # Start MCP
npm run mcp:inspect      # Inspector MCP

# Utilitaires
npm run scheduler        # Tâches cron
npm run setup            # Setup initial
```

---

## 🔧 Variables d'Environnement

### Obligatoires

```bash
# Base de données
DATABASE_URL=postgresql://user:pass@localhost:5432/eaf_local
DIRECT_URL=postgresql://user:pass@localhost:5432/eaf_local

# Sécurité
SESSION_SECRET=<32 caractères hex>
CSRF_SECRET=<32 caractères hex>
CRON_SECRET=<32 caractères hex>

# LLM (au moins un)
GEMINI_API_KEY=<votre clé>
OPENAI_API_KEY=<votre clé>
MISTRAL_API_KEY=<votre clé>
```

### Optionnelles

```bash
# Redis
REDIS_URL=redis://localhost:6379

# MCP Server
MCP_SERVER_URL=http://localhost:3100
MCP_API_KEY=<clé MCP>

# Cookies
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax

# Logs
LOG_LEVEL=info
LOG_PRETTY=true

# Tests E2E
E2E_USER_EMAIL=jean@eaf.local
E2E_USER_PASSWORD=demo1234
```

---

## 📈 Monitoring

### Logs (Pino)

**Niveaux :**
- `error` - Erreurs critiques
- `warn` - Avertissements
- `info` - Informations générales
- `debug` - Debug (dev uniquement)

**Exemple :**
```json
{
  "level": "info",
  "time": "2026-03-01T12:00:00.000Z",
  "msg": "llm.orchestrate.success",
  "skill": "bibliothecaire",
  "userId": "u-123",
  "model": "gemini-pro",
  "latencyMs": 245
}
```

### Web Vitals

**Métriques collectées :**
- FCP (First Contentful Paint)
- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- CLS (Cumulative Layout Shift)

---

## 📝 Documentation Complète

### Fichiers de Documentation

| Fichier | Description |
|---------|-------------|
| `README.md` | Vue d'ensemble |
| `QUICKSTART.md` | Démarrage rapide |
| `RUNBOOK_DEPLOY.md` | Déploiement |
| `docs/DOCUMENTATION_COMPLETE_PROJET.md` | Documentation complète |
| `docs/API_REFERENCE.md` | Référence API |
| `docs/GUIDE_ELEVE.md` | Guide élève |
| `docs/GUIDE_ENSEIGNANT.md` | Guide enseignant |
| `docs/RUNBOOK_PROD.md` | Runbook production |
| `docs/TRACEABILITY_MATRIX.md` | Matrice de traçabilité |
| `docs/LECTEUR_VIDEO_INTEGRATION.md` | Lecteur vidéo |
| `docs/BIBLIOTHEQUE_RESSOURCES_INTEGRATION.md` | Bibliothèque |
| `docs/TITRES_INTELLIGENTS.md` | Titres intelligents |
| `docs/LOGOS_INTEGRATION.md` | Logos |
| `docs/FILTRES_NETTOYAGE.md` | Filtres |
| `docs/RAPPORT_CORRECTION_TESTS.md` | Tests |
| `docs/DB_SETUP_SUMMARY.md` | Base de données |

---

## 🎯 Roadmap

### Version 1.0.0 (Actuelle)

- ✅ Authentification complète
- ✅ Ateliers écrit & oral
- ✅ Bibliothèque (553 ressources)
- ✅ Lecteur vidéo (322 vidéos)
- ✅ Tuteur IA RAG
- ✅ Espace enseignant
- ✅ Gamification

### Version 1.1.0 (À venir)

- [ ] Espace parent complet
- [ ] Notifications push
- [ ] Export PDF des parcours
- [ ] Statistiques avancées
- [ ] Transcodage vidéo automatique

### Version 2.0.0 (Future)

- [ ] Mobile app (React Native)
- [ ] Mode hors ligne
- [ ] Classes virtuelles
- [ ] Correction collaborative
- [ ] Analytics avancés

---

## 🤝 Contribution

### Structure des Commits

```
<type>(<scope>): <description>

feat(bibliotheque): ajout lecteur vidéo
fix(auth): correction rate-limit
docs(api): mise à jour référence
```

### Types de Commit

- `feat` - Nouvelle fonctionnalité
- `fix` - Correction de bug
- `docs` - Documentation
- `style` - Formatage
- `refactor` - Refactoring
- `test` - Tests
- `chore` - Maintenance

---

## 📄 Licence

© 2026 Nexus EAF - Tous droits réservés

---

## 📞 Support

**Contact :** support@nexus-eaf.fr

**Documentation :** `/docs`

**Issues :** GitHub Issues

---

**Dernière vérification :** 1 mars 2026  
**Statut :** ✅ Documentation à jour et fidèle au projet
