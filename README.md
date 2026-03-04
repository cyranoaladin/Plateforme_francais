# 🎓 Nexus EAF - Plateforme de Préparation au Bac de Français

**Version :** 1.0.0 | **Dernière mise à jour :** 1 mars 2026

[![Tests](https://img.shields.io/badge/tests-619%20passed-green)]()
[![TypeScript](https://img.shields.io/badge/typescript-strict-blue)]()
[![Next.js](https://img.shields.io/badge/next.js-16.1.6-black)]()
[![Ressources](https://img.shields.io/badge/ressources-553-orange)]()

Plateforme complète de préparation aux **Épreuves Anticipées de Français** (Première générale) avec :

- 🤖 Tuteur IA avec RAG (Recherche Augmentée)
- 📝 Atelier Écrit (commentaire, dissertation)
- 🎤 Atelier Oral (simulations interactives)
- 📚 Bibliothèque (553 ressources : annales, œuvres, vidéos, documents)
- 🎬 Lecteur Vidéo intégré (322 vidéos lisibles directement)
- 👨‍🏫 Espace Enseignant (suivi de classe)
- 🏆 Gamification (badges, XP, niveaux)

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

# 2. Configurer l'environnement (copier .env.example vers .env)
cp .env.example .env

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

## 📊 État du Projet

### ✅ Fonctionnalités en Production

| Module | Statut | Détails |
|--------|--------|---------|
| **Authentification** | ✅ Complet | Login/Register/Logout, rôles (élève, enseignant, parent) |
| **Dashboard** | ✅ Connecté | Timeline mémoire, scores, streak, badges |
| **Atelier Écrit** | ✅ Complet | Génération sujet, dépôt copie, OCR, correction IA, PDF |
| **Atelier Oral** | ✅ Complet | Sessions IA (start/interact/end), STT/TTS navigateur |
| **Onboarding** | ✅ 3 étapes | Profil, œuvres, auto-évaluation |
| **Bibliothèque** | ✅ 553 ressources | Annales (29), Œuvres (9), Vidéos (322), Documents (163), Rapports (30) |
| **Lecteur Vidéo** | ✅ Intégré | 322 vidéos lisibles directement (webm, mkv, mp4) |
| **Tuteur IA** | ✅ RAG activé | Réponses contextuelles avec citations |
| **Espace Enseignant** | ✅ Complet | Classes, progression, exports CSV |
| **Gamification** | ✅ Actif | Badges, XP, niveaux |

### ⚠️ Limites Connues

- `STORAGE_PROVIDER=s3` non implémenté (stockage local uniquement)
- Worker correction in-process (pas de queue externe)
- Métriques Web Vitals en mémoire (non persistées)
- Espace parent minimal (page placeholder)

---

## 🛠️ Stack Technique

**Frontend :** Next.js 16.1.6 (App Router), React 19, TypeScript strict, Tailwind CSS 4, Recharts, Lucide

**Backend :** Prisma 6, PostgreSQL 16+, pgvector (RAG), Pino, Node-cron

**IA :** Gemini API, OpenAI API, Mistral AI

**Tests :** Vitest (619 tests unitaires), Playwright (E2E)

---

## 📁 Commandes Principales

```bash
# Développement
npm run dev              # Serveur de développement (http://localhost:3000)
npm run build            # Build de production
npm run start            # Start production server

# Tests & Qualité
npm run lint             # ESLint
npm run typecheck        # TypeScript (vérification des types)
npm run test             # Tous les tests (unitaires + E2E)
npm run test:unit        # Tests unitaires (Vitest)
npm run test:e2e         # Tests E2E (Playwright)

# Base de données
npm run prisma:generate  # Générer Prisma Client
npm run prisma:migrate   # Appliquer les migrations
npm run db:seed          # Seeder la base (compte démo)

# RAG & IA
npm run rag:index        # Indexer documents pour RAG

# Ressources
npx tsx scripts/scan-ressources.ts  # Scanner les ressources (génère index JSON)
```

---

## 📚 Ressources Pédagogiques

Le dossier `/ressources` contient **553 fichiers** organisés :

```
ressources/
├── Annales_EAF/          # 29 sujets de bac (2022-2025)
├── Oeuvres/              # 9 œuvres intégrales au programme
├── Videos/               # 322 vidéos pédagogiques (webm, mkv)
├── Documents_Extraits/   # 163 documents pédagogiques
└── eaf_rapport_jury/     # 30 rapports de jury
```

**Accès :** http://localhost:3000/bibliotheque

### Titres Intelligents

Les ressources affichent des titres compréhensibles :

| Nom de fichier | Titre affiché |
|----------------|---------------|
| `22-frgean1.pdf` | 2022 - Bac Français Général - Amérique du Nord - Sujet 1 |
| `La_Peau_de_chagrin.pdf` | La Peau de chagrin - Balzac |
| `⏱️ BALZAC Resume.webm` | BALZAC, La Peau de chagrin - Résumé en 1 minute |

---

## 🔐 Variables d'Environnement

Consulter `.env.example` pour la liste complète. Principales variables :

```bash
# Base de données (obligatoire)
DATABASE_URL=postgresql://user:pass@localhost:5432/eaf_local
DIRECT_URL=postgresql://user:pass@localhost:5432/eaf_local

# Sécurité (obligatoire)
SESSION_SECRET=<32 caractères hex>
CSRF_SECRET=<32 caractères hex>

# LLM (au moins un obligatoire)
GEMINI_API_KEY=<votre clé>
OPENAI_API_KEY=<votre clé>

# Optionnel
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info
```

---

## 📖 Documentation Complète

| Document | Description |
|----------|-------------|
| **[docs/DOCUMENTATION_MASTER.md](docs/DOCUMENTATION_MASTER.md)** | 📘 Documentation complète du projet |
| [docs/API_REFERENCE.md](docs/API_REFERENCE.md) | Référence API détaillée |
| [docs/GUIDE_ELEVE.md](docs/GUIDE_ELEVE.md) | Guide élève |
| [docs/GUIDE_ENSEIGNANT.md](docs/GUIDE_ENSEIGNANT.md) | Guide enseignant |
| [docs/RUNBOOK_PROD.md](docs/RUNBOOK_PROD.md) | Runbook production |
| [docs/LECTEUR_VIDEO_INTEGRATION.md](docs/LECTEUR_VIDEO_INTEGRATION.md) | Lecteur vidéo |
| [docs/BIBLIOTHEQUE_RESSOURCES_INTEGRATION.md](docs/BIBLIOTHEQUE_RESSOURCES_INTEGRATION.md) | Bibliothèque |
| [docs/TITRES_INTELLIGENTS.md](docs/TITRES_INTELLIGENTS.md) | Titres intelligents |
| [docs/TRACEABILITY_MATRIX.md](docs/TRACEABILITY_MATRIX.md) | Matrice de traçabilité |

---

## 🧪 Tests

**619 tests unitaires** + **Tests E2E Playwright**

```bash
# Lancer tous les tests
npm run test

# Tests unitaires uniquement
npm run test:unit

# Tests E2E
npm run test:e2e
```

---

## 📄 Licence

© 2026 Nexus EAF - Tous droits réservés

---

## 🤝 Contribution

**Structure des commits :**
```
<type>(<scope>): <description>

feat(bibliotheque): ajout lecteur vidéo
fix(auth): correction rate-limit
docs(api): mise à jour référence
```

**Types :** `feat` | `fix` | `docs` | `style` | `refactor` | `test` | `chore`

---

**🎓 Bonne préparation au Bac de Français !**
