# Nexus Réussite EAF — Préparation au Bac de Français

**Version :** 1.0.0 | **Mise à jour :** 4 avril 2026 | **Production :** https://eaf.nexusreussite.academy

[![CI](https://github.com/cyranoaladin/Plateforme_francais/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/cyranoaladin/Plateforme_francais/actions/workflows/ci-cd.yml)
[![TypeScript](https://img.shields.io/badge/typescript-strict-blue)]()
[![Next.js](https://img.shields.io/badge/next.js-16.2-black)]()
[![Ressources](https://img.shields.io/badge/ressources-549-orange)]()

Plateforme SaaS de préparation aux **Épreuves Anticipées de Français** (Première générale).

---

## Fonctionnalités

| Module | Statut | Détails |
|--------|--------|---------|
| **Authentification** | ✅ | Login / register / forgot-password / verify-email |
| **Dashboard élève** | ✅ | Timeline mémoire durable (DB), scores, streak, badges, XP |
| **Atelier Écrit** | ✅ | Génération sujet, OCR, correction IA, barèmes officiels EAF, PDF |
| **Atelier Oral** | ✅ | Sessions IA start/interact/end, tirage dans le descriptif réel |
| **Descriptif de lecture** | ✅ | 4 objets d'étude, conformité réglementaire, upload PDF/image, OCR |
| **Onboarding** | ✅ | 3 étapes : profil, œuvres, auto-évaluation |
| **Bibliothèque** | ✅ | 549 fichiers : annales, œuvres, vidéos, documents, rapports jury |
| **Tuteur IA RAG** | ✅ | Réponses contextuelles avec citations, mémoire élève durable |
| **Carnet de lecture** | ✅ | Entrées, export PDF, révision espacée |
| **Espace Enseignant** | ✅ | Classes, progression, exports CSV |
| **Espace Parent** | ✅ | Tableau de bord de suivi, consentement RGPD |
| **Gamification** | ✅ | Badges, XP, niveaux, skill maps |
| **Admin** | ✅ | Gestion abonnements, codes d'activation, métriques |
| **Paiement** | ✅ | Virement bancaire + codes d'activation |

---

## Stack Technique

**Frontend :** Next.js 16.2 (App Router), React 19, TypeScript strict, Tailwind CSS 4
**Backend :** Prisma 6, PostgreSQL 16 + pgvector, Redis, BullMQ worker, Pino
**IA :** Gemini API, OpenAI API (OCR + STT), Mistral AI, MCP Server (24 outils)
**Tests :** Vitest (1383 tests unitaires, 248 fichiers), Playwright (E2E)
**Infrastructure :** Hetzner VPS, PM2 (user nexus), Docker-free, nginx HTTPS

---

## Démarrage Rapide

```bash
npm install
cp .env.example .env         # Configurer les variables d'environnement
npx prisma migrate dev       # Initialiser la base de données
npm run db:seed              # Créer un compte admin (credentials générés au terminal)
npm run dev                  # Démarrer sur http://localhost:3000
```

> Les credentials sont générés dynamiquement par `npm run db:seed`. Consulter la sortie du terminal.

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

## Déploiement — Serveur Dédié (VPS) uniquement

Ce projet est déployé exclusivement sur un serveur Linux dédié via SSH, PM2, nginx, PostgreSQL et Redis locaux.

### Ce projet n'utilise PAS
- Vercel ni les packages `@vercel/*` 
- Netlify
- Les runtimes edge ou serverless propriétaires

```bash
bash scripts/deploy.sh root@88.99.254.59
npm run check:no-vercel
```

---

## Pédagogie EAF — Conformité Officielle

- **Barèmes** : Commentaire et dissertation alignés sur les échelles descriptives (Académie de Nantes)
- **Grammaire** : Analyse syntaxique uniquement (Note de Service n°2019-042 du 18-4-2019)
- **Descriptif de lecture** : 16 textes minimum, 4 objets d'étude, tirage oral dans la liste réelle
- **Programme 2025** : Rimbaud, Ponge, Dorion / Corneille, Musset, Sarraute / Rabelais, La Bruyère, Gouges / Prévost, Balzac, Colette

---

## Production

| Indicateur | Valeur |
|------------|--------|
| URL | https://eaf.nexusreussite.academy |
| Health | https://eaf.nexusreussite.academy/api/v1/health |
| SHA servi | 5ca0719 |
| PM2 | eaf-nextjs-blue, eaf-mcp, eaf-worker (user nexus) |
| Déploiement | `bash scripts/deploy.sh root@88.99.254.59` |

---

## Commandes Utiles

```bash
npm run typecheck        # TypeScript strict
npm run test:unit        # Tests unitaires (Vitest)
npm run build            # Build production
bash scripts/deploy.sh root@IP        # Déploiement
bash scripts/smoke-test-production.sh # Smoke tests prod
```

---

© 2026 Nexus Réussite — Tous droits réservés
