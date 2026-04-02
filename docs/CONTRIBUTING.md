# Guide de Contribution - Nexus Réussite EAF

Bienvenue! Ce guide établit les conventions et processus pour contribuer au projet Nexus Réussite EAF.

## Table des Matières

1. [Démarrage Rapide](#démarrage-rapide)
2. [Standards de Code](#standards-de-code)
3. [Développement API](#développement-api)
4. [Tests et Qualité](#tests-et-qualité)
5. [Processus Git et PR](#processus-git-et-pr)
6. [Documentation](#documentation)
7. [Déploiement](#déploiement)

---

## Démarrage Rapide

### Prérequis

- Node.js 20+
- PostgreSQL 16 avec pgvector
- Redis 7+
- npm 10+

### Installation

```bash
# Cloner le repo
git clone https://github.com/cyranoaladin/Plateforme_francais.git
cd Plateforme_francais

# Installer dépendances
npm ci

# Configurer environnement
cp .env.example .env.local
# Éditer .env.local avec vos variables

# Setup DB
npx prisma migrate dev
npx prisma db seed  # si script de seed existe

# Démarrer en développement
npm run dev
```

### Structure Projet

```
├── src/
│   ├── app/              # Next.js 16 App Router (pages et API routes)
│   ├── components/       # Composants React réutilisables
│   ├── lib/              # Logique métier, services, utilitaires
│   └── scripts/          # Scripts maintenance et seed
├── tests/
│   ├── unit/             # Tests unitaires (Vitest)
│   ├── integration/      # Tests integration (Vitest + DB)
│   ├── e2e/              # Tests end-to-end (Playwright)
│   └── contracts/        # Tests contrats API (Schemathesis)
├── docs/                 # Documentation technique
├── packages/             # Monorepo packages (MCP server, etc.)
└── prisma/               # Schéma DB et migrations
```

---

## Standards de Code

### Formatage et Linting

**Configuration automatique** (`.eslintrc.json`, `.prettierrc`):
```bash
# Linter
npm run lint          # Vérifier
npm run lint:fix      # Auto-fix

# Formatter
npm run format        # Vérifier
npm run format:fix    # Auto-fix
```

**Hooks pré-commit** (Husky):
- ESLint auto-fix
- Prettier auto-format
- TypeScript type check

### Conventions Nommage

**Fichiers**:
- Composants React: `PascalCase.tsx`
- Utilitaires: `camelCase.ts`
- Routes API: `route.ts` (Next.js convention)
- Tests: `*.test.ts` ou `*.spec.ts`

**Variables et fonctions**:
```typescript
// Variables: camelCase
const userSession = await getSession();

// Constantes: UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;

// Fonctions: camelCase, verbes
function fetchUserData() {}

// Composants: PascalCase
function UserProfile() {}

// Types/Interfaces: PascalCase
interface UserProfile {}
type ApiResponse = {};
```

### TypeScript

**Strict mode activé** - tous les fichiers doivent passer `tsc --noEmit`:
```typescript
// ✅ Bon
function greet(name: string): string {
  return `Hello, ${name}`;
}

// ❌ Éviter
function greet(name: any) {  // any interdit sauf cas exceptionnels
  return `Hello, ${name}`;
}
```

**Prefer explicit types**:
```typescript
// ✅ Bon
const users: User[] = await prisma.user.findMany();

// ⚠️ Acceptable si type inféré correct
const count = users.length;  // number inféré
```

---

## Développement API

Pour le développement de nouvelles routes API, consulter le guide dédié:

📘 **[Guide Contributeur API](./GUIDE_CONTRIBUTEUR_API.md)**

Points clés:
- ✅ **Authentification systématique** (sauf endpoints publics explicites)
- ✅ **Validation Zod** obligatoire pour toutes mutations
- ✅ **CSRF protection** sur POST/PUT/PATCH/DELETE
- ✅ **Rate limiting** adapté par type d'endpoint
- ✅ **Logging structuré** avec contexte métier
- ✅ **Messages i18n** via `copy.ts`

---

## Tests et Qualité

### Coverage Gates CI

**Seuils minimums** (progressifs):
- Lines: 37%
- Functions: 34%
- Branches: 30%
- Statements: 37%

### Types de Tests

#### 1. Tests Unitaires (Vitest)

**Scope**: Logique isolée, handlers API, utilitaires

```bash
npm run test:unit              # Tous les tests unitaires
npm run test:unit:watch        # Mode watch
npm run test:unit -- my-file   # Test spécifique
```

**Exemple**:
```typescript
// tests/unit/lib/my-utility.test.ts
import { describe, it, expect } from 'vitest';
import { myUtility } from '@/lib/my-utility';

describe('myUtility', () => {
  it('should return correct value', () => {
    expect(myUtility('input')).toBe('expected');
  });
});
```

#### 2. Tests Integration (Vitest + DB)

**Scope**: Interaction avec DB réelle, flux complets

```bash
npm run test:integration
```

**Setup DB test**: PostgreSQL test database configurée via `DATABASE_URL` en env test

#### 3. Tests E2E (Playwright)

**Scope**: Workflows utilisateur complets dans navigateur

```bash
npm run test:e2e              # Tous browsers
npm run test:e2e:chromium     # Chromium uniquement
npm run test:e2e:headed       # Mode headed (voir UI)
```

#### 4. Tests Contrats API (Schemathesis)

**Scope**: Validation contrats OpenAPI

```bash
npm run test:contracts              # Endpoints publics
npm run test:contracts:auth         # Endpoints authentifiés
npm run test:contracts:teacher-rbac # RBAC enseignants
```

### Checklist PR Tests

Avant de soumettre une PR:
- [ ] Tests unitaires ajoutés/mis à jour
- [ ] Tests passent localement (`npm test`)
- [ ] Coverage maintenu/amélioré
- [ ] Tests E2E mis à jour si changement UI
- [ ] Contrats OpenAPI mis à jour si nouvelle route publique

---

## Processus Git et PR

### Protection de main

Aucun push direct sur `main`. Toute modification passe par une PR.

**Configuration requise dans GitHub (Settings → Branches → main) :**
- ✅ Require a pull request before merging
- ✅ Require status checks to pass: `pr-gate`
- ✅ Include administrators

### Avant chaque push

Lance la suite locale de vérification :

```bash
npm run pre-push
```

Cette commande exécute séquentiellement :
1. `npm run typecheck` — TypeScript strict
2. `npm run lint` — ESLint 0 warning
3. `npm run test:unit -- --run` — Tests unitaires
4. `npm run ci:fr-copy -- --update` — Contrôle copy française
5. `npm run check-banned` — Détection phrases bannies
6. `npm run check:no-vercel` — Garde anti-Vercel

#### Template PR

```markdown
## Description
[Description concise du changement]

## Type de changement
- [ ] Bug fix
- [ ] Nouvelle fonctionnalité
- [ ] Breaking change
- [ ] Documentation

## Checklist
- [ ] Tests ajoutés/mis à jour
- [ ] Documentation mise à jour
- [ ] Pas de régression

## Tests
[Décrire comment tester]

## Screenshots (si applicable)
[Ajouter screenshots]
```

### Revue Code

**Reviewer checklist**:
- [ ] Code suit conventions projet
- [ ] Logique claire et maintenable
- [ ] Tests couvrent cas nominaux et edge cases
- [ ] Pas de secrets hardcodés
- [ ] Performance acceptable
- [ ] Sécurité: input validation, auth, XSS/injection
- [ ] Logging approprié

---

## Documentation

### Documentation Requise

**Pour toute PR significative**:
1. **Code comments**: Logique non évidente uniquement
2. **JSDoc**: Fonctions publiques et API
3. **README updates**: Si changement setup/install
4. **Docs techniques**: Nouvelles architectures/patterns

### Où Documenter

| Type | Emplacement |
|------|-------------|
| API Routes | `docs/GUIDE_CONTRIBUTEUR_API.md` + OpenAPI spec |
| Déploiement | `docs/RUNBOOK_PRODUCTION.md` |
| Architecture | `docs/ARCHITECTURE.md` (si existe) |
| Onboarding | `README.md` + `docs/GETTING_STARTED.md` |

### Documentation API Publique

**Maintenir** `tests/contracts/openapi.public.yaml` pour endpoints publics:
```yaml
paths:
  /api/v1/my-endpoint:
    get:
      summary: Brief description
      parameters: [...]
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: object
                properties:
                  data: {...}
```

---

## Déploiement

### Environnements

| Environnement | Branch | URL | Auto-deploy |
|---------------|--------|-----|-------------|
| Development | local | localhost:3000 | N/A |
| Staging | `develop` | staging.nexusreussite.academy | Oui (push) |
| Production | `main` | eaf.nexusreussite.academy | Oui (merge PR) |

### Processus Déploiement Production

**Voir runbook détaillé**: [`docs/RUNBOOK_PRODUCTION.md`](./RUNBOOK_PRODUCTION.md)

**Étapes**:
1. PR mergée dans `main`
2. CI/CD (GitHub Actions) exécute Gates 1-5
3. Si succès: Déploiement Blue-Green automatique
4. Smoke tests post-déploiement
5. Bascule traffic Nginx
6. Monitoring post-deploy 5min

**Rollback**: Voir RUNBOOK_PRODUCTION.md section "Rollback Rapide"

---

## Ressources

### Documentation Technique

- **[Runbook Production](./RUNBOOK_PRODUCTION.md)**: Déploiement, monitoring, rollback
- **[Guide Contributeur API](./GUIDE_CONTRIBUTEUR_API.md)**: Développement routes API
- **[API Health Documentation](./API_HEALTH_PUBLIC.md)**: Endpoint monitoring

### Outils Recommandés

**IDE**:
- VS Code + extensions (ESLint, Prettier, TypeScript)
- WebStorm

**Extensions VS Code utiles**:
- Prisma
- Tailwind CSS IntelliSense
- GitLens
- Error Lens

**CLI Tools**:
- `gh`: GitHub CLI (PRs, issues)
- `prisma studio`: DB GUI
- `pm2`: Process monitoring local

---

## Support et Communication

**Problèmes techniques**:
- Issues GitHub: [https://github.com/cyranoaladin/Plateforme_francais/issues](https://github.com/cyranoaladin/Plateforme_francais/issues)
- Discussions: [GitHub Discussions si activé]

**Questions**:
- Check docs existantes d'abord
- Puis ouvrir issue avec label `question`

**Urgences production**:
- Voir RUNBOOK_PRODUCTION.md section "Contacts et escalade"

---

**Dernière mise à jour**: 2026-03-15
**Mainteneurs**: Dev Team Nexus Réussite EAF

**Merci de contribuer au projet! 🚀**
