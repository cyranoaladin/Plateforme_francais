# Guide Contributeur - Routes API Nexus Réussite EAF

## Introduction

Ce guide établit les conventions et bonnes pratiques pour créer ou modifier des routes API dans le projet Nexus Réussite EAF (Next.js 16 App Router).

**Objectifs**:
- ✅ Cohérence des contrats API (request/response)
- ✅ Sécurité par défaut (auth, validation, rate limiting)
- ✅ Observabilité et debugging (logs, erreurs)
- ✅ Tests automatisés (unitaires, contrats, E2E)

## Architecture Routes API

### Structure Fichiers

```
src/app/api/v1/
├── auth/
│   ├── login/route.ts
│   ├── register/route.ts
│   └── reset-password/route.ts
├── billing/
│   ├── check-quota/route.ts
│   └── status/route.ts
├── cron/
│   ├── session-cleanup/route.ts
│   └── weekly-reports/route.ts
├── enseignant/
│   ├── dashboard/route.ts
│   └── export/route.ts
├── oral/
│   ├── session/
│   │   ├── start/route.ts
│   │   └── [sessionId]/
│   │       ├── interact/route.ts
│   │       └── end/route.ts
│   └── voice-submit/route.ts
└── health/route.ts
```

**Convention nommage**:
- Dossiers en **kebab-case** (lowercase avec tirets)
- Fichiers de route toujours nommés `route.ts`
- Paramètres dynamiques entre crochets `[param]`

### Versioning API

**Version actuelle**: `v1`

**Chemins**:
- ✅ `/api/v1/ressources`
- ❌ `/api/ressources` (pas de version)
- ❌ `/v1/api/ressources` (ordre incorrect)

**Politique changements**:
- **Breaking changes**: Créer `v2/` en parallèle, déprécier `v1/` progressivement
- **Non-breaking changes**: Modifier `v1/` directement (champs optionnels, nouveaux endpoints)

## Anatomie d'une Route API

### Template de Base

```typescript
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { validateCsrf } from '@/lib/security/csrf';
import { parseJsonBody } from '@/lib/validation/request';
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';
import { copy } from '@/lib/copy/fr';

// Schéma validation (Zod)
const RequestSchema = z.object({
  field1: z.string().min(1).max(100),
  field2: z.number().int().positive().optional(),
});

export async function POST(request: NextRequest) {
  const apiCopy = copy.api;

  // 1. Rate limiting
  const rateCheck = await checkRateLimit(request, {
    max: 10,
    windowMs: 60_000,
    keyPrefix: 'endpoint_name',
  });
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: apiCopy.common.rateLimitExceeded },
      {
        status: 429,
        headers: { 'Retry-After': rateCheck.retryAfter.toString() },
      },
    );
  }

  // 2. Authentification
  const { auth, errorResponse } = await requireAuthenticatedUser(request);
  if (errorResponse) return errorResponse;

  // 3. CSRF (mutations uniquement)
  const csrfError = await validateCsrf(request);
  if (csrfError) return csrfError;

  // 4. Validation payload
  const bodyResult = await parseJsonBody(request, RequestSchema);
  if (!bodyResult.success) {
    return NextResponse.json(
      { error: apiCopy.common.invalidPayload, details: bodyResult.error },
      { status: 400 },
    );
  }

  const { field1, field2 } = bodyResult.data;

  // 5. Logique métier
  try {
    const result = await prisma.resource.create({
      data: {
        userId: auth.user.id,
        field1,
        field2,
      },
    });

    logger.info({ userId: auth.user.id, resourceId: result.id }, 'resource.created');

    return NextResponse.json({
      ok: true,
      resource: {
        id: result.id,
        field1: result.field1,
        field2: result.field2,
      },
    });
  } catch (error) {
    logger.error({ error, userId: auth.user.id }, 'resource.create_failed');
    return NextResponse.json(
      { error: apiCopy.common.internalError },
      { status: 500 },
    );
  }
}
```

## Checklist Sécurité

### 1. Authentification

**Routes publiques** (exceptions rares):
- `/api/v1/auth/login`
- `/api/v1/auth/register`
- `/api/v1/health`
- `/api/v1/payments/clictopay/callback` (IP allowlist à la place)

**Routes authentifiées** (défaut):
```typescript
const { auth, errorResponse } = await requireAuthenticatedUser(request);
if (errorResponse) return errorResponse;

// auth.user disponible ensuite
const userId = auth.user.id;
```

**Routes avec contrôle rôle**:
```typescript
const { auth, errorResponse } = await requireUserRole(request, 'enseignant');
if (errorResponse) return errorResponse;

// auth.user.role === 'enseignant' garanti
```

### 2. CSRF Protection

**Quand appliquer CSRF**:
- ✅ Toutes les mutations (POST, PUT, PATCH, DELETE)
- ❌ Requêtes lecture seule (GET, HEAD, OPTIONS)

```typescript
import { validateCsrf } from '@/lib/security/csrf';

export async function POST(request: NextRequest) {
  const csrfError = await validateCsrf(request);
  if (csrfError) return csrfError;

  // Suite de la route...
}
```

**Token CSRF côté client**:
```typescript
// Récupérer token depuis cookie ou header
const csrfToken = document.cookie
  .split('; ')
  .find(row => row.startsWith('csrf_token='))
  ?.split('=')[1];

// Inclure dans requête
fetch('/api/v1/ressource', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken,
  },
  body: JSON.stringify(data),
});
```

### 3. Rate Limiting

**Configuration par type de route**:

| Type Route | Max Requests | Window | Key Prefix |
|------------|--------------|--------|------------|
| Auth (login) | 5 | 15 min | `auth_login` |
| Auth (register) | 3 | 1 heure | `auth_register` |
| Mutations critiques | 10 | 1 min | `endpoint_name` |
| Lecture | 100 | 1 min | `read_endpoint` |
| Cron (IP-based) | 10 | 1 heure | `cron_route` |

```typescript
const rateCheck = await checkRateLimit(request, {
  max: 10,              // Nombre max requêtes
  windowMs: 60_000,     // Fenêtre en ms (1 min)
  keyPrefix: 'my_endpoint',
});

if (!rateCheck.allowed) {
  return NextResponse.json(
    { error: 'Too many requests' },
    {
      status: 429,
      headers: { 'Retry-After': rateCheck.retryAfter.toString() },
    },
  );
}
```

### 4. Validation Input

**Zod Schemas** (recommandé):
```typescript
import { z } from 'zod';

const CreateEvaluationSchema = z.object({
  texte: z.string().min(50).max(5000),
  type: z.enum(['commentaire', 'dissertation']),
  niveau: z.enum(['premiere', 'terminale']).optional(),
});

// Validation avec parseJsonBody
const bodyResult = await parseJsonBody(request, CreateEvaluationSchema);
if (!bodyResult.success) {
  return NextResponse.json(
    { error: 'Invalid payload', details: bodyResult.error },
    { status: 400 },
  );
}

const { texte, type, niveau } = bodyResult.data; // Types inférés automatiquement
```

**Types courants**:
- IDs: `z.string().uuid()` ou `z.string().cuid()`
- Emails: `z.string().email()`
- URLs: `z.string().url()`
- Dates: `z.string().datetime()` ou `z.coerce.date()`
- Énumérations: `z.enum(['val1', 'val2'])`

## Gestion Erreurs

### Codes HTTP Standards

| Code | Usage | Exemple |
|------|-------|---------|
| 200 | Succès (GET, PUT, DELETE) | Ressource retournée |
| 201 | Création réussie (POST) | Nouvelle ressource créée |
| 400 | Bad Request (validation échouée) | Payload invalide |
| 401 | Unauthorized (auth manquante/invalide) | Token expiré |
| 403 | Forbidden (pas les permissions) | Accès ressource d'un autre user |
| 404 | Not Found | Ressource inexistante |
| 409 | Conflict (état incohérent) | Email déjà utilisé |
| 422 | Unprocessable Entity | Business rule violation |
| 429 | Too Many Requests | Rate limit dépassé |
| 500 | Internal Server Error | Erreur serveur inattendue |
| 503 | Service Unavailable | DB ou dépendance down |

### Format Erreur Standard

```typescript
// Erreur avec message localisé
return NextResponse.json(
  {
    error: apiCopy.endpoint.specificError,  // Message FR depuis copy.ts
    code: 'SPECIFIC_ERROR_CODE',            // Code machine (optionnel)
  },
  { status: 400 },
);

// Erreur avec détails validation
return NextResponse.json(
  {
    error: apiCopy.common.invalidPayload,
    details: {
      field1: ['Required field'],
      field2: ['Must be positive integer'],
    },
  },
  { status: 400 },
);
```

### Logging Erreurs

```typescript
import { logger } from '@/lib/logger';

try {
  // Logique métier
} catch (error) {
  logger.error(
    {
      error,
      userId: auth.user.id,
      context: 'specific_operation',
    },
    'operation.failed',
  );

  return NextResponse.json(
    { error: apiCopy.common.internalError },
    { status: 500 },
  );
}
```

**Principe**:
- ✅ Logger l'erreur technique avec contexte
- ✅ Retourner message générique au client (sécurité)
- ❌ Ne jamais exposer stack traces ou détails DB au client

## Contrats API et Documentation

### Types Response

**Définir types explicites**:
```typescript
// types/api.ts
export interface CreateResourceResponse {
  ok: true;
  resource: {
    id: string;
    field1: string;
    createdAt: string;
  };
}

export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, string[]>;
}
```

**Utiliser dans route**:
```typescript
export async function POST(request: NextRequest): Promise<NextResponse<CreateResourceResponse | ApiErrorResponse>> {
  // ...
  return NextResponse.json({
    ok: true,
    resource: {
      id: result.id,
      field1: result.field1,
      createdAt: result.createdAt.toISOString(),
    },
  });
}
```

### OpenAPI / Schemathesis

**Contrats publics** (`tests/contracts/openapi.public.yaml`):
```yaml
/api/v1/health:
  get:
    summary: Health check endpoint
    responses:
      '200':
        description: Service healthy
        content:
          application/json:
            schema:
              type: object
              properties:
                status:
                  type: string
                  enum: [ok]
                service:
                  type: string
```

**Tests contrats automatisés**:
```bash
npm run test:contracts         # Public endpoints
npm run test:contracts:auth    # Authenticated endpoints
```

## Tests Requis

### 1. Tests Unitaires (Route Handler)

```typescript
// tests/unit/api/my-route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mocks
vi.mock('@/lib/db/client');
vi.mock('@/lib/auth/guard');

describe('POST /api/v1/my-route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retourne 401 si non authentifié', async () => {
    // Mocker auth failure
    vi.mocked(requireAuthenticatedUser).mockResolvedValueOnce({
      auth: null,
      errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    });

    const { POST } = await import('@/app/api/v1/my-route/route');
    const request = new NextRequest('http://localhost:3000/api/v1/my-route', {
      method: 'POST',
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('crée ressource si payload valide', async () => {
    // Mocker auth success + DB
    vi.mocked(requireAuthenticatedUser).mockResolvedValueOnce({
      auth: { user: { id: 'user-1', role: 'eleve' } },
      errorResponse: null,
    });
    vi.mocked(prisma.resource.create).mockResolvedValueOnce({
      id: 'res-1',
      field1: 'value',
    });

    const { POST } = await import('@/app/api/v1/my-route/route');
    const request = new NextRequest('http://localhost:3000/api/v1/my-route', {
      method: 'POST',
      body: JSON.stringify({ field1: 'value' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.resource.id).toBe('res-1');
  });
});
```

### 2. Tests Intégration (Avec DB)

```typescript
// tests/integration/api/my-route.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/db/client';

describe('POST /api/v1/my-route (integration)', () => {
  beforeAll(async () => {
    // Setup DB test data
    await prisma.user.create({ data: { email: 'test@example.com' } });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.resource.deleteMany();
    await prisma.user.deleteMany();
  });

  it('intègre correctement avec DB réelle', async () => {
    // Test avec vraie DB (pas de mocks)
  });
});
```

### 3. Tests E2E (Playwright)

```typescript
// tests/e2e/my-workflow.spec.ts
import { test, expect } from '@playwright/test';

test('workflow complet création ressource', async ({ page }) => {
  // 1. Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');

  // 2. Créer ressource via UI (appel API sous-jacent)
  await page.goto('/ressources/new');
  await page.fill('[name="field1"]', 'value');
  await page.click('button[type="submit"]');

  // 3. Vérifier succès
  await expect(page.locator('.success-message')).toBeVisible();
});
```

## Localisation (i18n)

**Messages centralisés** (`src/lib/copy/fr.ts`):
```typescript
export const copy = {
  api: {
    common: {
      invalidPayload: 'Les données fournies sont invalides.',
      rateLimitExceeded: 'Trop de requêtes. Veuillez réessayer plus tard.',
      internalError: 'Une erreur est survenue. Veuillez réessayer.',
    },
    myEndpoint: {
      resourceNotFound: 'Ressource introuvable.',
      specificError: 'Message d\'erreur spécifique.',
    },
  },
};
```

**Utilisation dans route**:
```typescript
import { copy } from '@/lib/copy/fr';

export async function GET(request: NextRequest) {
  const apiCopy = copy.api;

  if (!resource) {
    return NextResponse.json(
      { error: apiCopy.myEndpoint.resourceNotFound },
      { status: 404 },
    );
  }

  // ...
}
```

**Tests copy cohérence**:
```typescript
// tests/unit/api/my-route-copy.test.ts
it('utilise copy.api au lieu de messages codés en dur', () => {
  const routeCode = fs.readFileSync('src/app/api/v1/my-route/route.ts', 'utf8');

  expect(routeCode).toContain("from '@/lib/copy/fr'");
  expect(routeCode).not.toContain('\"Resource not found\"'); // Hardcoded string
});
```

## Bonnes Pratiques

### ✅ À Faire

- Toujours valider input avec Zod ou équivalent
- Logger contexte métier (userId, resourceId, action)
- Retourner types explicites (TypeScript)
- Tester les 3 niveaux (unitaire, intégration, E2E)
- Utiliser copy.ts pour tous les messages utilisateur
- Documenter contrats OpenAPI pour endpoints publics
- Rate limiting adapté au type de route
- CSRF sur toutes les mutations
- Fail-closed en production (503 si DB down)

### ❌ À Éviter

- Validation côté client uniquement (toujours re-valider serveur)
- Messages d'erreur exposant détails techniques (stack, DB schema)
- Logique métier complexe directement dans route handler (extraire dans services)
- Mélanger authentification et logique métier
- Rate limiting trop strict (frustration user) ou trop laxiste (abuse)
- Oublier cleanup ressources (DB connections, files)
- Hard-coder valeurs config (utiliser env vars)
- Ignorer échecs async (toujours try/catch ou .catch())

## Checklist PR Review

**Avant de soumettre une PR pour nouvelle route**:

- [ ] Route suit conventions nommage (`/api/v1/resource/route.ts`)
- [ ] Authentification appropriée (public vs authentifié vs rôle)
- [ ] Validation input avec Zod schema
- [ ] CSRF appliqué sur mutations
- [ ] Rate limiting configuré
- [ ] Logging contexte métier
- [ ] Messages erreur localisés (copy.ts)
- [ ] Types explicites pour responses
- [ ] Tests unitaires route handler
- [ ] Tests intégration si logique DB complexe
- [ ] Contrat OpenAPI documenté si endpoint public
- [ ] Pas de secrets hardcodés
- [ ] Gestion erreurs robuste (try/catch, 500 appropriés)

---

**Dernière mise à jour**: 2026-03-15
**Version**: 1.0.0
**Propriétaire**: Dev Team
