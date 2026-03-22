# Nexus Réussite — Préparation EAF Bac Français 2026

[![CI/CD](https://github.com/cyranoaladin/Plateforme_francais/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/cyranoaladin/Plateforme_francais/actions/workflows/ci-cd.yml)

Plateforme de préparation aux Épreuves Anticipées de Français (EAF) avec ateliers IA, correction de copies, simulation d'oral officiel et tuteur pédagogique avec corpus sourcé.

**Production** : [eaf.nexusreussite.academy](https://eaf.nexusreussite.academy)

## Stack technique

| Composant | Technologie |
|-----------|------------|
| Framework | Next.js 16.2, React 19, TypeScript strict |
| Base de données | PostgreSQL 16 + pgvector (Prisma 6) |
| Cache | Redis |
| LLM | Mistral (primaire) + Gemini/OpenAI (fallback) |
| RAG | Ingestor Docker + pgvector local |
| MCP Server | 20 outils pédagogiques |
| Email | Nodemailer SMTP (Hostinger port 465) + React Email |
| Déploiement | VPS, PM2, Nginx, scripts/deploy.sh |
| CI/CD | GitHub Actions (6 gates) |
| CSS | Tailwind CSS 4 |

## Plans

| Plan | Prix | Oral | Corrections | Tuteur |
|------|------|------|-------------|--------|
| **Freemium** | 0 TND | 1/mois | 2/mois | 3/jour |
| **Premium** | 99 TND/mois | 10/semaine | 20/mois | 100/jour |
| **Masterium** | 129 TND/mois | Illimité | Illimité | Illimité |

**Paiement au lancement** : virement bancaire ou espèces → l'admin génère un code d'activation → l'élève le saisit sur la plateforme.

## Fonctionnalités

- **Atelier Écrit** : génération de sujets EAF, dépôt de copie (PDF/photo), correction IA rubrique par rubrique
- **Atelier Oral** : simulation officielle 4 phases (lecture /2, explication /8, grammaire /2, entretien /8)
- **Atelier Langue** : exercices de grammaire adaptatifs
- **Quiz** : quiz thématiques avec scoring et explications
- **Tuteur IA** : guidage pédagogique avec citations RAG (BO, Eduscol, rapports de jury)
- **Bibliothèque** : 548 ressources (annales, œuvres, vidéos, documents, rapports jury)
- **Carnet** : notes personnelles par œuvre
- **Descriptif** : gestion du descriptif de lecture pour l'oral

## Rôles utilisateur

| Rôle | Description |
|------|------------|
| **Élève** | Profil principal, obligatoire. Accès à tous les ateliers. |
| **Parent** | Facultatif. Suivi de progression de ses enfants. |
| **Enseignant** | Facultatif. Suivi de classe via code enseignant. |
| **Admin** | Gestion des utilisateurs, codes d'activation, paiements manuels. |

## Démarrage rapide

```bash
# Installation
npm ci
npx prisma generate

# Configuration
cp .env.example .env
# Remplir les variables dans .env

# Base de données
npx prisma migrate deploy
npx tsx scripts/seed.ts

# Développement
npm run dev
```

## Commandes

| Commande | Description |
|----------|------------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build production |
| `npm run test:unit` | Tests unitaires (159 fichiers, 1106 tests) |
| `npm run lint` | ESLint |
| `npx knip` | Détection code mort |
| `npm run ci:fr-copy` | Contrôle du français |
| `npm run mcp:build` | Build du serveur MCP |
| `npm run email:dev` | Preview des templates email |

## Déploiement production

```bash
bash scripts/deploy.sh root@88.99.254.59
```

Le script synchronise le code, installe les dépendances, exécute les migrations Prisma, build Next.js et redémarre PM2.

Vérification post-deploy :
```bash
curl -s https://eaf.nexusreussite.academy/api/v1/health
```

## Documentation

| Document | Contenu |
|----------|---------|
| [docs/COMPLETE_GUIDE.md](docs/COMPLETE_GUIDE.md) | **Guide complet exhaustif** (START HERE) |
| [docs/API_REFERENCE.md](docs/API_REFERENCE.md) | Référence API REST complète |
| [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) | Schéma base de données (40+ tables) |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Architecture technique |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Guide de déploiement |
| [docs/PLANS_AND_BILLING.md](docs/PLANS_AND_BILLING.md) | Plans, quotas et facturation |
| [docs/EMAIL_SETUP.md](docs/EMAIL_SETUP.md) | Configuration email SMTP |
| [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) | Guide de contribution |
| [docs/GUIDE_ELEVE.md](docs/GUIDE_ELEVE.md) | Guide utilisateur élève |
| [docs/GUIDE_ENSEIGNANT.md](docs/GUIDE_ENSEIGNANT.md) | Guide enseignant |
| [docs/RUNBOOK_PRODUCTION.md](docs/RUNBOOK_PRODUCTION.md) | Runbook opérationnel |

## Sécurité

- Authentification par session (cookies HttpOnly, Secure, SameSite=lax)
- CSRF double-submit token
- CSP avec nonce dynamique
- HSTS preload
- Rate limiting (Redis)
- RBAC par rôle (élève, parent, enseignant, admin)
- Protection des mineurs (RGPD, pas de publicité ciblée)
- Branch protection GitHub (enforce_admins activé)

## Licence

Propriétaire — © 2026 Nexus Réussite. Tous droits réservés.
