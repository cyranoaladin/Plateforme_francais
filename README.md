# Nexus Réussite EAF — Préparation au Bac de Français

**Version :** 1.0.0 | **Mise à jour :** 4 avril 2026 | **Production :** https://eaf.nexusreussite.academy

[![Tests](https://img.shields.io/badge/tests-1363%20passed-green)]()
[![TypeScript](https://img.shields.io/badge/typescript-strict-blue)]()
[![Next.js](https://img.shields.io/badge/next.js-16.x-black)]()
[![Ressources](https://img.shields.io/badge/ressources-548-orange)]()

Plateforme SaaS de préparation aux **Épreuves Anticipées de Français** (Première générale).

---

## Fonctionnalités

| Module | Statut | Détails |
|--------|--------|---------|
| **Authentification** | ✅ | Login / register / forgot-password, rôles élève / enseignant / parent |
| **Dashboard élève** | ✅ | Timeline mémoire durable (DB), scores, streak, badges, XP |
| **Atelier Écrit** | ✅ | Génération sujet, dépôt copie, OCR, correction IA, PDF téléchargeable |
| **Atelier Oral** | ✅ | Sessions IA start/interact/end, STT/TTS navigateur, bilan officiel |
| **Onboarding** | ✅ | 3 étapes : profil, œuvres, auto-évaluation |
| **Bibliothèque** | ✅ | 548 fichiers : annales, œuvres, vidéos, documents, rapports jury |
| **Tuteur IA RAG** | ✅ | Réponses contextuelles avec citations, mémoire élève durable |
| **Carnet de lecture** | ✅ | Entrées, export PDF, révision espacée |
| **Espace Enseignant** | ✅ | Classes, progression, exports CSV |
| **Espace Parent** | ✅ | Tableau de bord de suivi, consentement RGPD |
| **Gamification** | ✅ | Badges, XP, niveaux, skill maps |
| **Admin** | ✅ | Gestion abonnements, codes d'activation, métriques |
| **Paiement** | ✅ | Virement bancaire + codes d'activation (ClicToPay phase 2) |

---

## Stack Technique

**Frontend :** Next.js 16.x (App Router), React 19, TypeScript strict, Tailwind CSS 4

**Backend :** Prisma 6, PostgreSQL 16 + pgvector, Redis, BullMQ worker, Pino

**IA :** Gemini API, OpenAI API (OCR + STT), Mistral AI, MCP Server (24 outils)

**Tests :** Vitest (1363 tests unitaires), Playwright (E2E)

**Infrastructure :** Hetzner VPS, PM2 (user nexus), Docker-free, nginx HTTPS

---

## Démarrage Rapide

```bash
npm install
cp .env.example .env         # Configurer les variables
npx prisma migrate dev       # Initialiser la base
npm run db:seed              # Créer un compte admin
npm run dev                  # Démarrer sur http://localhost:3000
```

> Pour les credentials de test, utiliser `npm run db:seed` qui génère un compte admin.

---

## Variables d'Environnement Obligatoires

```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/eaf_local
SESSION_SECRET=<32 chars hex>
CSRF_SECRET=<32 chars hex>
GEMINI_API_KEY=<votre clé>   # OU OPENAI_API_KEY
```

Voir `.env.example` pour la liste complète.

---

## Production

| Indicateur | Valeur |
|------------|--------|
| URL | https://eaf.nexusreussite.academy |
| Health | https://eaf.nexusreussite.academy/api/v1/health |
| PM2 | eaf-nextjs-blue, eaf-mcp, eaf-worker (user nexus) |
| Déploiement | `bash scripts/deploy.sh root@88.99.254.59` |

---

## 🖥️ Déploiement — Serveur Dédié (VPS)

Ce projet est déployé exclusivement sur un serveur dédié Linux via SSH, PM2, Nginx, PostgreSQL et Redis locaux.

### Ce projet n'utilise PAS

- ❌ Vercel ni les packages `@vercel/*`
- ❌ Netlify
- ❌ Les runtimes edge ou serverless propriétaires

### Garde-fous

```bash
npm run check:no-vercel
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/COMPLETE_GUIDE.md](docs/COMPLETE_GUIDE.md) | Guide complet |
| [docs/API_REFERENCE.md](docs/API_REFERENCE.md) | Référence API |
| [docs/RUNBOOK_PRODUCTION.md](docs/RUNBOOK_PRODUCTION.md) | Runbook prod |
| [docs/GUIDE_ELEVE.md](docs/GUIDE_ELEVE.md) | Guide élève |
| [docs/GUIDE_ENSEIGNANT.md](docs/GUIDE_ENSEIGNANT.md) | Guide enseignant |

---

## Commandes Utiles

```bash
npm run test:unit        # Tests unitaires (Vitest)
npm run typecheck        # TypeScript strict
npm run build            # Build de production
bash scripts/deploy.sh root@IP   # Déploiement complet
npm run rag:index        # Indexer les ressources pour le RAG
```

---

© 2026 Nexus Réussite — Tous droits réservés
